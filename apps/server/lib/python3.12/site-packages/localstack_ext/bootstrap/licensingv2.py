_O='SSL_NO_VERIFY'
_N='machine'
_M='product'
_L='licensing-api-key'
_K='licensing-auth-token'
_J='LOCALSTACK_AUTH_TOKEN'
_I='credentials'
_H='LOCALSTACK_CLI'
_G='seconds'
_F='version'
_E='name'
_D='utf-8'
_C=False
_B=True
_A=None
import base64,binascii,copy,dataclasses,fnmatch,hashlib,hmac,json,logging,os,platform,re,textwrap,threading
from datetime import datetime,timezone
from enum import Enum
from json import JSONDecodeError,JSONEncoder
from pathlib import PurePosixPath
from typing import Any,List,Optional,Protocol,Tuple,TypedDict,Union,cast
import dateutil.parser
from localstack import config,constants
from localstack.utils.files import load_file
from localstack.utils.objects import singleton_factory
from localstack.utils.strings import md5,to_str
from plugin import Plugin,PluginDisabled,PluginLifecycleListener,PluginSpec
LOG=logging.getLogger(__name__)
ENV_LOCALSTACK_API_KEY='LOCALSTACK_API_KEY'
ENV_LOCALSTACK_AUTH_TOKEN=_J
LICENSE_FILE_NAME='license.json'
class LicensingError(Exception):
	default_message=_A
	def __init__(C,msg=_A,*B):
		A=msg;A=A or C.default_message
		if A:super().__init__(A,*B)
		else:super().__init__(*B)
	def get_user_friendly(A):return textwrap.dedent(f"""
            ===============================================
            License activation failed! 🔑❌

            Reason: {A}

            Due to this error, Localstack has quit. LocalStack pro features can only be used with a valid license.

            - Please check that your credentials are set up correctly and that you have an active license.
              You can find your credentials in our webapp at https://app.localstack.cloud.
            - If you want to continue using LocalStack without pro features you can set `ACTIVATE_PRO=0`.
            """)
	def get_user_friendly_cli(A):B=''.join(textwrap.fill(str(A))).strip();return f"""
=============================================
You tried to use a LocalStack feature that requires a paid subscription,
but the license activation has failed! 🔑❌

Reason: {B}

Due to this error, LocalStack has quit.

- Please check that your credentials are set up correctly and that you have an active license.
  You can find your credentials in our webapp at https://app.localstack.cloud.
- If you haven't yet, sign up on the webapp and get a free trial!
"""
class LicenseFormatError(LicensingError):default_message='A parsing error was encountered while parsing the license file or while decoding the license secret.'
class LicenseRequestError(LicensingError):0
class CredentialsTypeError(LicenseRequestError):0
class CredentialsMissingError(LicensingError):default_message=f"No credentials were found in the environment. Please make sure to either set the {ENV_LOCALSTACK_AUTH_TOKEN} variable to a valid auth token, or the {ENV_LOCALSTACK_API_KEY} variable to a valid LocalStack API key. If you are using the CLI, you can also run `localstack auth set-token`."
class CredentialsFormatError(LicenseRequestError):default_message='There was an error while validating the format of the credentials defined in your environment.'
class AuthTokenFormatError(CredentialsFormatError):default_message=f"The auth token defined in {ENV_LOCALSTACK_AUTH_TOKEN} has an invalid format. Please make sure that the environment variable {ENV_LOCALSTACK_AUTH_TOKEN} contains a valid auth token. You can find your auth token in the LocalStack web app https://app.localstack.cloud."
class CredentialsInvalidError(LicenseRequestError):default_message=f"The credentials defined in your environment are invalid. Please make sure to either set the {ENV_LOCALSTACK_AUTH_TOKEN} variable to a valid auth token, or the {ENV_LOCALSTACK_API_KEY} variable to a valid LocalStack API key. You can find your auth token or API key in the LocalStack web app https://app.localstack.cloud."
class LicenseValidationError(LicensingError):0
class LicenseSignatureMismatchError(LicenseValidationError):default_message='Calculated signature and license signature do not match. Please check that the credentials in your environment match the one for your license.'
class LicenseActivationError(LicensingError):default_message='The license could not be activated for unknown reasons.'
class LicenseExpiredError(LicenseActivationError):default_message='The license has expired.'
class LicenseStaleError(LicenseActivationError):
	default_message='Offline activation failed! Your local license file that is used to activate LocalStack has expired. Please connect to the Internet and restart LocalStack to renew it.'
	def __init__(A,license,msg=_A,*B):super().__init__(msg,*B);A.license=license
class LicenseStatusError(LicenseActivationError):default_message='Unexpected license status.'
class ProductMismatchError(LicenseActivationError):default_message='The product you are trying to activate does not match the ones in the license agreement.'
class Credentials:
	def to_bytes(A):raise NotImplementedError
	def encoded(A):raise NotImplementedError
	def is_valid(A):raise NotImplementedError
	def __eq__(A,other):return other.to_bytes()==A.to_bytes()
class ApiKeyCredentials(Credentials):
	api_key:str
	def __init__(A,api_key):A.api_key=api_key
	def __repr__(A):return'"%s..."(%s)'%(A.api_key[:3],len(A.api_key))
	def encoded(A):return A.api_key
	def is_valid(A):return _B
	def to_bytes(A):return A.api_key.encode(_D)
class AuthToken(Credentials):
	TOKEN_PREFIX='ls-';TOKEN_REGEX=re.compile('^%s[a-zA-Z]{4}[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$'%TOKEN_PREFIX);TOKEN_LENGTH=36+len(TOKEN_PREFIX);token:str
	def __init__(A,token):A.token=token
	def __repr__(A):B=8+len(A.TOKEN_PREFIX);return f"{A.token[:B]}-****-****-****-************"
	def encoded(A):return A.token
	def to_bytes(A):return A.token.encode(_D)
	def is_valid(A):return A.is_syntax_valid()and A.is_checksum_valid()
	def is_syntax_valid(A):
		if len(A.token)!=A.TOKEN_LENGTH:return _C
		return bool(A.TOKEN_REGEX.match(A.token))
	def is_checksum_valid(A):
		if len(A.token)!=A.TOKEN_LENGTH:return _C
		B=A.token[:-4];B=B.removeprefix(A.TOKEN_PREFIX);C=A.token[-4:];return md5(B)[:4]==C
class LicenseStatus(Enum):UNKNOWN='UNKNOWN';ACTIVE='ACTIVE';INACTIVE='INACTIVE';EXPIRED='EXPIRED';SUSPENDED='SUSPENDED'
class ProductInfo(TypedDict):name:str;version:str
@dataclasses.dataclass
class License:
	id:str;license_format:str;signature:Optional[str]
	def copy(A):return copy.deepcopy(A)
	def to_log_string(A):return A.id
@dataclasses.dataclass
class LicenseV1(License):
	license_type:str;issue_date:datetime;expiry_date:datetime;products:List[ProductInfo]=dataclasses.field(default_factory=list);license_status:LicenseStatus=LicenseStatus.UNKNOWN;license_secret:Optional[str]=_A;last_activated:Optional[datetime]=_A;reactivate_after:Optional[datetime]=_A
	def to_log_string(A):B=A.id if len(A.id)>30 else f"{A.id[:3]}...";return f"{B}:{A.license_type}"
class LicenseSigner:
	def calculate_signature(A,license):raise NotImplementedError
class LicensingClient:
	def request_new_license(A,credentials):raise NotImplementedError
	def validate_license(A,credentials,license):raise NotImplementedError
	def activate_license_offline(A,credentials,license):raise NotImplementedError
	def activate_license_online(A,credentials,license):raise NotImplementedError
	def decode_decryption_key(A,credentials,license):raise NotImplementedError
class LicenseSecretDecoder:
	def decode_license_secret(A,license):raise NotImplementedError
class _LicenseJsonEncoder(JSONEncoder):
	def default(B,obj):
		A=obj
		if isinstance(A,datetime):return A.isoformat(timespec=_G)
		if isinstance(A,bytes):return base64.b64encode(A).decode(_D)
		if isinstance(A,Credentials):return A.encoded()
		if isinstance(A,LicenseStatus):return A.value
		return super().default(A)
class LicenseSerializer:
	def serialize(B,license):
		if not license.license_format:raise LicenseFormatError('missing license_format attribute')
		if license.license_format=='1':A=dataclasses.asdict(license);A.pop(_I,_A);return json.dumps(A,cls=_LicenseJsonEncoder,indent=2).encode(_D)
		raise LicenseFormatError(f"unknown license format version {license.license_format}")
class LicenseParser:
	def parse(F,document):
		D='license_status'
		try:A=json.loads(document)
		except JSONDecodeError as B:raise LicenseFormatError(f"could not de-serialize json license: {B}")from B
		try:
			if A.get('license_format')!='1':raise LicenseFormatError('unknown license format')
			E=['issue_date','expiry_date','reactivate_after']
			for C in E:A[C]=dateutil.parser.parse(A[C])
			A[D]=LicenseStatus(A[D]);return LicenseV1(**A)
		except(KeyError,ValueError)as B:raise LicenseFormatError(f"error parsing license file: {B}")from B
class AESLicenseV1SecretDecoder(LicenseSecretDecoder):
	scheme='LS1.0'
	def __init__(A,credentials):A.credentials=credentials
	def decode_license_secret(A,license):
		if not license.signature:raise LicenseFormatError('license is not signed')
		B=hashlib.sha256();B.update(A.credentials.to_bytes());B.update(binascii.unhexlify(license.signature));F=B.digest();G=base64.b64decode(license.license_secret);C=G.split(b':',maxsplit=1)
		if len(C)!=2:raise LicenseFormatError('invalid license key format')
		D,E=C
		if D.decode(_D)!=A.scheme:raise ValueError(f"unknown scheme {D}")
		H=E[:16];I=E[16:];return A._aes_decrypt(F,H,I)
	def _aes_decrypt(I,key,iv,encrypted_data):from cryptography.hazmat.primitives import padding as C;from cryptography.hazmat.primitives.ciphers import Cipher as D,algorithms as E,modes;F=D(E.AES(key),modes.CBC(iv));A=F.decryptor();G=A.update(encrypted_data)+A.finalize();B=C.PKCS7(128).unpadder();H=B.update(G);return H+B.finalize()
class LicenseV1ClientBase(LicensingClient):
	def validate_license(C,credentials,license):
		try:
			A=datetime.now(tz=timezone.utc)
			if license.expiry_date<A:raise LicenseExpiredError()
			if license.license_status!=LicenseStatus.ACTIVE:raise LicenseStatusError(f"expected license to be ACTIVE, was {license.license_status}")
			if license.reactivate_after<A:raise LicenseStaleError(license)
			if LicenseSignerV1(credentials).calculate_signature(license)!=license.signature:raise LicenseSignatureMismatchError()
		except KeyError as B:raise LicenseFormatError(f"missing attribute: {B}")
	def activate_license_offline(A,credentials,license):
		A.validate_license(credentials,license)
		if not A.current_product_version_matches(license):raise ProductMismatchError()
	def current_product_version_matches(G,license_):
		A=license_;from localstack import __version__
		try:
			B=A.products[0][_F].split('.');C=__version__.split('.')
			if A.products[0][_F].startswith('*'):return _B
			D=B[0],B[1];E=C[0],C[1]
		except IndexError as F:raise LicenseFormatError()from F
		return D==E
class LicenseV1Client(LicenseV1ClientBase):
	def request_new_license(B,credentials):
		A=credentials
		if not A:raise CredentialsMissingError()
		if not A.is_valid():raise CredentialsFormatError()
		return B._request_license(A)
	def decode_decryption_key(E,credentials,license):
		B=base64.b64decode(license.license_secret);C=B.split(b':',maxsplit=1);A=to_str(C[0])
		if A==AESLicenseV1SecretDecoder.scheme:D=AESLicenseV1SecretDecoder(credentials)
		else:raise LicenseFormatError(f"unknown license key scheme {A}")
		return D.decode_license_secret(license)
	def _get_machine_data(C):from localstack.utils.analytics.metadata import get_client_metadata as B;A=B();return{'id':A.machine_id,'cli':config.is_env_true(_H),'ci':A.is_ci,'system':get_system_information_summary()}
	def _get_product_data(B):from localstack.constants import VERSION as A;return{_E:'localstack-pro',_F:A}
	def activate_license_online(B,credentials,license):
		A=credentials;import requests as F;from localstack.utils.http import get_proxies as G;H=G()
		if isinstance(A,AuthToken):D=_K;E=A.token
		elif isinstance(A,ApiKeyCredentials):D=_L;E=A.api_key
		else:raise CredentialsTypeError(f"{type(A)}")
		C=F.post('%s/license/activate'%constants.API_ENDPOINT,json.dumps({'license_id':license.id,_I:{'type':D,'token':E},_M:B._get_product_data(),_N:B._get_machine_data()}),verify=not config.is_env_true(_O),proxies=H)
		if C.ok:return cast(LicenseV1,LicenseParser().parse(C.content))
		B._server_error_to_exception(C)
	def _request_license(B,credentials):
		A=credentials;import requests as F;from localstack.utils.http import get_proxies as G;H=G()
		if isinstance(A,AuthToken):D=_K;E=A.token
		elif isinstance(A,ApiKeyCredentials):D=_L;E=A.api_key
		else:raise CredentialsTypeError(f"{type(A)}")
		C=F.post('%s/license/request'%constants.API_ENDPOINT,json.dumps({_I:{'type':D,'token':E},_M:B._get_product_data(),_N:B._get_machine_data()}),verify=not config.is_env_true(_O),proxies=H)
		if C.ok:return LicenseParser().parse(C.content)
		B._server_error_to_exception(C)
	def _server_error_to_exception(F,response):
		D='message';B=response
		try:
			C=B.json()
			if not C.get(D):raise LicensingError(f"Unexpected license server error: {B.text}")
			A=C[D]
		except Exception:raise LicensingError(f"Unexpected license server error: {B.text}")
		if A=='licensing.credentials.invalid':raise CredentialsInvalidError()
		if A=='licensing.credentials.format':raise AuthTokenFormatError()
		if A=='licensing.activation_error':raise LicenseActivationError()
		if A=='licensing.license.not_found':raise LicenseActivationError('The license with the given ID was not found.')
		if A.startswith('licensing.license.invalid_status'):E=A.split(':');raise LicenseStatusError(f"Expected license to be ACTIVE, was {E[1]}")
		if A=='licensing.license.expired':raise LicenseExpiredError()
		else:raise LicensingError(f"Unexpected license server error: {B.text}")
class LicensedLocalstackEnvironment:
	license:Optional[License]
	def __init__(A,client,parser=_A,serializer=_A):A.client=client;A.parser=parser or LicenseParser();A.serializer=serializer or LicenseSerializer();A.license=_A;A.license_file_path=_A;A._activated=_C;A._mutex=threading.RLock()
	@property
	def activated(self):return self._activated
	def activate(A,offline_only=_C):
		with A._mutex:
			if A.activated:return
			A.activate_license(offline_only)
			if not A.is_decryption_enabled():A.enable_decryption()
			os.environ[constants.ENV_PRO_ACTIVATED]='1'
	def activate_license(A,offline_only=_C):
		D=offline_only;C=A.require_valid_credentials();license=_A
		try:
			try:
				E=A._try_activate_offline(C)
				if E and A.activated:license,F=E;A.license=license;A.license_file_path=F;LOG.info('Successfully activated cached license %s from %s 🔑✅',license.to_log_string(),F);return
			except LicenseStaleError as B:
				license=B.license
				if D:raise
		except LicensingError as B:
			if D:raise
			LOG.debug('Attempting online activation after offline activation failed: %s:%s',type(B).__name__,B)
		if license:
			try:license=A.client.activate_license_online(C,license);A.client.validate_license(C,license);A._activated=_B;A.license=license;LOG.info('Successfully activated license %s 🔑✅',license.to_log_string());A.save_license();return
			except LicensingError as B:LOG.debug('There was an error activating the license: %s. Trying to get a new one.',B)
		license=A.client.request_new_license(C);A.client.validate_license(C,license);A._activated=_B;A.license=license;LOG.info('Successfully requested and activated new license %s 🔑✅',license.to_log_string());A.save_license()
	def _try_activate_offline(A,credentials):
		D=credentials;C=[]
		for B in A.get_license_file_read_locations():
			if not os.path.isfile(B):continue
			try:
				with open(B,'rb')as F:license=A.parser.parse(F.read());A.client.activate_license_offline(D,license);A._activated=_B;A.client.decode_decryption_key(D,license);return license,B
			except LicensingError as E:LOG.debug('Failed to activate license file %s: %s',B,E);C.append(E)
		if C:raise C[0]
	def has_product_license(A,product_name):
		C=product_name
		if not A.activated or not A.license:return _C
		if not isinstance(A.license,LicenseV1):return _C
		for B in A.license.products:
			if'*'in B[_E]:
				if fnmatch.fnmatch(C,B[_E]):return _B
			elif B[_E]==C:return _B
		return _C
	def enable_decryption(A):
		if not A.activated or not A.license:raise ValueError('license not yet activated')
		from localstack_ext.bootstrap.decryption import DecryptionHandler as D,init_source_decryption as E;from localstack_ext.config import ROOT_FOLDER as F;B=D(A.client.decode_decryption_key(A.require_valid_credentials(),A.license))
		try:
			G=f"{F}/localstack_ext/utils/decryption_check.py.enc";C=load_file(G,mode='rb')
			if not C:raise ValueError('Decryption check file not found. Are you using localstack pro in host mode?')
			H=B.decrypt(C)
			if b'decryption_check'not in H:raise ValueError('Decryption resulted in invalid python file')
		except Exception as I:raise LicenseActivationError('Error while trying to perform code activation. You may be using a version of LocalStack that is not within your license agreement.')from I
		E(B)
	def is_decryption_enabled(A):
		try:from localstack_ext.utils.decryption_check import decryption_check;return _B
		except ImportError:return _C
	def save_license(A):
		if not A.activated:raise ValueError('not yet activated')
		if not A.license:raise ValueError('no license to save')
		B=A.get_license_file_write_location();LOG.debug('Caching license file to %s',B)
		try:
			os.makedirs(os.path.dirname(B),exist_ok=_B)
			with open(B,'wb')as C:C.write(A.serializer.serialize(A.license))
		except OSError as D:LOG.debug('Error caching license file to %s: %s',B,D)
	def get_license_file_write_location(A):
		if config.is_env_true(_H):return os.path.join(config.dirs.cache,LICENSE_FILE_NAME)
		else:return os.path.join(config.dirs.cache,LICENSE_FILE_NAME)
	def get_license_file_read_locations(A):
		if config.is_env_true(_H):return[os.path.join(config.dirs.cache,LICENSE_FILE_NAME)]
		else:return[os.path.join(config.dirs.config,LICENSE_FILE_NAME),os.path.join(config.dirs.cache,LICENSE_FILE_NAME),os.path.join(config.dirs.static_libs,LICENSE_FILE_NAME)]
	def require_valid_credentials(B):
		A=get_credentials_from_environment()
		if not A:raise CredentialsMissingError()
		if not A.is_valid():raise CredentialsInvalidError()
		return A
class DevLocalstackEnvironment(LicensedLocalstackEnvironment):
	def activate_license(A,offline_only=_C):LOG.debug('Using test license, skipping activation.');A._activated=_B
	def has_product_license(A,product_name):return _B
	def get_license_file_locations(A):return[]
	def enable_decryption(A):raise LicenseActivationError('Cannot activate pro code when using test credentials')
class LicenseSignerV1(LicenseSigner):
	def __init__(A,credentials):A.credentials=credentials
	def calculate_signature(E,license):
		B=_D
		try:
			F=E.credentials.to_bytes();A=hmac.new(F,digestmod='sha256');A.update(license.id.encode(B))
			for D in sorted(license.products,key=lambda p:(p[_E],p[_F])):A.update(D[_E].encode(B));A.update(D[_F].encode(B))
			A.update(license.license_format.encode(B));A.update(license.issue_date.isoformat(timespec=_G).encode(B));A.update(license.expiry_date.isoformat(timespec=_G).encode(B));A.update(license.license_type.encode(B));A.update(license.license_status.value.encode(B))
			if license.reactivate_after:A.update(license.reactivate_after.isoformat(timespec=_G).encode(B))
		except(KeyError,AttributeError)as C:raise LicenseFormatError(f"{C}")from C
		except ValueError as C:raise LicenseFormatError(f"error in license attribute value: {C}")from C
		return A.hexdigest()
@singleton_factory
def get_system_information_summary():
	C=','
	try:from localstack.utils.docker_utils import DOCKER_CLIENT as D;B=D.get_system_info();return C.join([B['OperatingSystem'],B['KernelVersion'],B['Architecture']])
	except Exception as E:print(E);pass
	A=platform.uname()
	if config.is_in_docker:return C.join([f"{A.system}(Container)",A.release,A.machine])
	return C.join([A.system,A.release,A.machine])
def get_credentials_from_environment():
	C='\'" ';B=os.environ.get(ENV_LOCALSTACK_API_KEY,'').strip(C);A=os.environ.get(ENV_LOCALSTACK_AUTH_TOKEN,'').strip(C)
	if not A and config.is_env_true(_H):
		from localstack_ext.bootstrap.auth import get_auth_cache as D
		try:A=D().get(_J)
		except Exception:pass
	if B and A:raise CredentialsFormatError(f"please specify either {ENV_LOCALSTACK_API_KEY} or {ENV_LOCALSTACK_AUTH_TOKEN}, not both")
	if B:return ApiKeyCredentials(B)
	if A:return AuthToken(A)
class RequiresLicenseMarker(Protocol):requires_license:bool
class LicensedPluginLoaderGuard(PluginLifecycleListener):
	def __init__(A,environment=_A):A.environment=environment or get_licensed_environment()
	def on_init_after(C,plugin_spec,plugin):
		A=plugin_spec
		try:D=plugin.requires_license
		except AttributeError:return
		if not D:return
		B=f"{A.namespace}/{A.name}"
		if not C.environment.has_product_license(B):LOG.warning(f"Disabled plugin {B} since it is not part of the current license agreement 🔑❌");raise PluginDisabled(A.namespace,A.name)
def has_product_license(product_name):return get_licensed_environment().has_product_license(product_name)
@singleton_factory
def get_licensed_environment():
	A=get_credentials_from_environment();B=LicenseV1Client()
	if A and A.to_bytes()==b'test':return DevLocalstackEnvironment(client=B)
	return LicensedLocalstackEnvironment(client=B)
def configure_container_licensing(cfg):
	B=cfg;from localstack.utils.container_utils.container_client import VolumeBind as D;A=get_credentials_from_environment()
	if isinstance(A,AuthToken):B.env_vars[ENV_LOCALSTACK_AUTH_TOKEN]=A.encoded()
	elif isinstance(A,ApiKeyCredentials):B.env_vars[ENV_LOCALSTACK_API_KEY]=A.encoded()
	C=os.path.join(config.dirs.cache,LICENSE_FILE_NAME)
	if os.path.exists(C):E=str(PurePosixPath(config.Directories.for_container().config)/LICENSE_FILE_NAME);B.volumes.add(D(C,E,read_only=_B))