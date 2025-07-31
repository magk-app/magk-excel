_E='version'
_D='versions'
_C=True
_B=False
_A=None
import io,json,logging,os,zipfile
from abc import ABC,abstractmethod
from functools import singledispatch
from pathlib import Path
from typing import Callable,Dict,List,Optional,Tuple,TypedDict,Union
from urllib.parse import urlparse
import click,requests,yaml
from click import ClickException
from localstack import config,constants
from localstack.cli import console
from localstack.constants import APPLICATION_JSON,HEADER_CONTENT_TYPE
from localstack.utils.bootstrap import in_ci
from localstack.utils.files import load_file,new_tmp_file,rm_rf,save_file
from localstack.utils.http import download,safe_requests
from localstack.utils.strings import to_str
from requests.structures import CaseInsensitiveDict
from localstack_ext.bootstrap import auth
from localstack_ext.bootstrap.pods.constants import INTERNAL_REQUEST_PARAMS_HEADER
from localstack_ext.bootstrap.pods.remotes.api import CloudPodsRemotesClient
from localstack_ext.bootstrap.pods.remotes.configs import RemoteConfig,RemoteConfigParams
from localstack_ext.bootstrap.pods.remotes.params import get_remote_params_callable
from localstack_ext.config import POD_LOAD_CLI_TIMEOUT
from localstack_ext.constants import API_PATH_PODS,CLOUDPODS_METADATA_FILE
LOG=logging.getLogger(__name__)
HEADER_LS_API_KEY='ls-api-key'
HEADER_LS_VERSION='ls-version'
HEADER_AUTHORIZATION='Authorization'
class PodInfo(TypedDict,total=_B):name:str;version:int;services:List[str];description:str;size:int;remote:str
def get_state_zip_from_instance(services=_A):
	B=services;C=f"{get_pods_endpoint()}/state";D=','.join(B)if B else'';E={INTERNAL_REQUEST_PARAMS_HEADER:'{}'};A=requests.get(C,params={'services':D},headers=E);F=PodInfo(services=A.headers.get('x-localstack-pod-services','').split(','),size=int(A.headers.get('x-localstack-pod-size',0)))
	if A.status_code>=400:raise Exception(f"Unable to get local pod state via management API {C} (code {A.status_code}): {A.content}")
	return A.content,F
class CloudPodRemoteAttributes(TypedDict,total=_B):is_public:bool;description:Optional[str];services:Optional[List[str]]
class PodSaveRequest(TypedDict,total=_B):remote:Optional[Dict[str,Union[str,Dict]]];attributes:Optional[CloudPodRemoteAttributes]
class CloudPodsService(ABC):
	@abstractmethod
	def save(self,pod_name,attributes=_A,remote=_A,local=_B,version=_A):0
	@abstractmethod
	def delete(self,pod_name,remote=_A,delete_from_remote=_C):0
	@abstractmethod
	def load(self,pod_name,remote=_A,version=_A,merge_strategy=_A,ignore_version_mismatches=_C):0
	@abstractmethod
	def list(self,remote=_A):0
	@abstractmethod
	def get_versions(self,pod_name,remote=_A):0
	def _get_localstack_pod_version(J,pod_name,version=_A):
		B=pod_name;A=version;C=requests.get(create_platform_url(B),headers=_get_headers())
		if not C.ok:_raise_exception_with_formatted_message(f"Unable to load pod {B}",C)
		D=json.loads(C.content);E=D[_D];F=int(D['max_version'])
		if A and A>F:raise Exception(f"Unable to load pod {B} with version {A}. The maximum version available in the remote storage is {F}")
		G=list(filter(lambda v:v[_E]==A,E));H=G[0]if G else E[-1];I=H['localstack_version'];return I
	def get_metamodel(B,pod_name,version):
		A=requests.get(url=f"{get_pods_endpoint()}/state/metamodel",headers=_get_headers())
		if not A.ok:_raise_exception_with_formatted_message(f"Unable to get metamodel for pod {pod_name}",A)
		return json.loads(A.content)
	def set_remote_attributes(G,pod_name,attributes,remote=_A):
		D='is_public';C=remote;B=pod_name
		if C:LOG.debug(f"Trying to set attributes for remote '{C}'. Currently we support attributes only for the default remote");return
		E=create_platform_url(B);F=auth.get_auth_headers();A=safe_requests.patch(E,headers=F,json={D:attributes[D]})
		if not A.ok:raise Exception(f"Error setting remote attributes for Cloud Pod {B} (code {A.status_code}): {A.text}")
def _get_headers():
	B={HEADER_CONTENT_TYPE:APPLICATION_JSON};C=CaseInsensitiveDict(auth.get_auth_headers())
	for A in(HEADER_AUTHORIZATION,HEADER_LS_API_KEY,HEADER_LS_VERSION):
		if C.get(A):B[A]=C[A]
	return B
def _raise_exception_with_formatted_message(message,response):raise Exception(f"{message}: {response.text}")
def _get_remote_params_payload(remote):
	A=remote
	if not A:return{}
	C=_get_remote_configuration(A,render_params=_B);B=get_remote_params_callable(C.remote_url)
	if not B:return{}
	A.remote_params=B();return{'remote':A.to_dict()}
class CloudPodsClient(CloudPodsService):
	def save(G,pod_name,attributes=_A,remote=_A,local=_B,version=_A):
		D=version;C=pod_name;A=f"{get_pods_endpoint()}/{C}?"
		if local:A+='&local=true'
		if D:A+=f"&version={D}"
		E=_get_remote_params_payload(remote);E.update({'attributes':attributes});B=requests.post(url=A,json=E,headers=_get_headers())
		if not B.ok:_raise_exception_with_formatted_message(f"Unable to save pod {C}",B)
		F=json.loads(B.content);return F
	def delete(E,pod_name,remote=_A,delete_from_remote=_C):
		A=pod_name;B=f"{get_pods_endpoint()}/{A}"
		if not delete_from_remote:B+='?local=true'
		D=_get_remote_params_payload(remote);C=requests.delete(url=B,json=D,headers=_get_headers())
		if not C.ok:_raise_exception_with_formatted_message(f"Unable to delete Cloud Pod '{A}'",C)
	def load(H,pod_name,remote=_A,version=_A,merge_strategy=_A,ignore_version_mismatches=_B):
		C=ignore_version_mismatches;B=version;A=pod_name
		if in_ci():C=_C
		if not C:
			D=H._get_localstack_pod_version(pod_name=A,version=B);E=get_ls_version_from_health()
			if E!=D and not click.confirm(f"This Cloud Pod was created with LocalStack {D} but you are running LocalStack {E}. Cloud Pods might be incompatible across different LocalStack versions.\nLoading a Cloud Pod with mismatching version might lead to a corrupted state of the emulator. Do you want to continue?"):raise click.Abort('LocalStack version mismatch')
		F=f"{get_pods_endpoint()}/{A}"
		if B:F+=f"?version={B}"
		I=_get_remote_params_payload(remote);G=requests.put(url=F,json=I,headers=_get_headers())
		if not G.ok:_raise_exception_with_formatted_message(f"Unable to load pod {A}",G)
	def list(C,remote=_A):
		B=_get_remote_params_payload(remote);A=requests.get(url=get_pods_endpoint(),json=B,headers=_get_headers())
		if not A.ok:_raise_exception_with_formatted_message('Unable to list Cloud Pods',A)
		return json.loads(A.content).get('cloudpods',[])
	def get_versions(D,pod_name,remote=_A):
		B=pod_name;C=_get_remote_params_payload(remote);A=requests.get(url=f"{get_pods_endpoint()}/{B}/versions",json=C,headers=_get_headers())
		if A.status_code==404:raise Exception(f"Cloud Pod {B} not found")
		if not A.ok:_raise_exception_with_formatted_message(f"Unable to get versions for pod {B}",A)
		return json.loads(A.content).get(_D,[])
def _get_remote_configuration(params,render_params=_C):
	A=params;D=CloudPodsRemotesClient()
	try:C=D.get_remote(name=A.remote_name)
	except Exception as E:raise ClickException(f"Error getting configuration for the remote {A.remote_name}")from E
	B=C['remote_url']
	if render_params:B=A.render_url(B)
	LOG.debug('Remote configuration: %s',C);return RemoteConfig(remote_url=B)
def get_pods_endpoint():A=config.external_service_url();return f"{A}{API_PATH_PODS}"
class CloudPodsLocalService:
	def export_pod(I,target,services=_A):
		C=target;G,D=get_state_zip_from_instance(services=services);E=urlparse(C);A=os.path.abspath(os.path.join(E.netloc,E.path));F=Path(A).parent.absolute()
		if not os.path.exists(F):raise Exception(f"{F} is not a valid path")
		save_file(file=A,content=G);B=get_environment_metadata();B['name']=os.path.basename(C);B.update(D)
		with zipfile.ZipFile(file=A,mode='a')as H:H.writestr(CLOUDPODS_METADATA_FILE,yaml.dump(B))
		return D
	def import_pod(H,source):
		C='pro';A=source;D=get_protocol_access(A);B=D(A);E=zipfile.ZipFile(io.BytesIO(B),'r');F=read_metadata_from_pod(E)or{};G=get_environment_metadata().get(C)
		if F.get(C,_B)and not G:console.print('Warning: You are trying to load a Cloud Pod generated with a Pro license.The loaded state might be incomplete.')
		return inject_pod_endpoint(content=B)
def list_public_pods():
	B=create_platform_url('public');C=auth.get_auth_headers();A=safe_requests.get(B,headers=C)
	if not A.ok:raise Exception(to_str(A.content))
	D=json.loads(A.content);return[A['pod_name']for A in D]
@singledispatch
def read_metadata_from_pod(zip_file):
	try:A=yaml.safe_load(zip_file.read(CLOUDPODS_METADATA_FILE));return A
	except KeyError:LOG.debug('No %s file in the archive',CLOUDPODS_METADATA_FILE)
@read_metadata_from_pod.register(bytes)
def _(zip_file):A=zip_file;A=zipfile.ZipFile(io.BytesIO(A),'r');return read_metadata_from_pod(A)
@read_metadata_from_pod.register(str)
def _(zip_file):
	with zipfile.ZipFile(zip_file)as A:return read_metadata_from_pod(A)
def inject_pod_endpoint(content):
	A=get_pods_endpoint()
	try:B=requests.post(A,data=content,timeout=POD_LOAD_CLI_TIMEOUT)
	except requests.exceptions.Timeout as C:raise Exception('Timeout exceed for the pod load operation. To avoid this issue, try to increase thevalue of the POD_LOAD_CLI_TIMEOUT configuration variable.')from C
	return B.ok
def get_environment_metadata():
	C=get_pods_endpoint();A=f"{C}/environment";B=requests.get(A)
	if not B.ok:raise Exception(f"Unable to retrieve environment metadata from {A}")
	return json.loads(B.content)
def get_git_base_url(user,repo):return f"https://raw.githubusercontent.com/{user}/{repo}/main"
def get_protocol_access(url):
	A=urlparse(url).scheme
	if A=='file':return get_zip_content_from_file
	elif A in['http','https']:return get_zip_content_from_http
	elif A=='git':return get_zip_content_from_git
	raise Exception(f"Protocol {A} not valid")
def get_zip_content_from_file(url):
	B=url;B=urlparse(B);A=os.path.abspath(os.path.join(B.netloc,B.path))
	if not os.path.exists(A):raise Exception(f"Path {A} does not exist")
	if not os.path.isfile(A):raise Exception(f"Path {A} is not a file")
	return load_file(A,mode='rb')
def get_zip_content_from_http(url):
	A=requests.get(url)
	if not A.ok:raise Exception(f"Unable to fetch Cloud Pod from URL {url} ({A.status_code}): {A.content}")
	return A.content
def get_zip_content_from_git(url):
	E=url[len('git://'):];A=E.split('/');F,G,H=A[0],A[1],A[2];I=f"{get_git_base_url(F,G)}";C=f"{I}/{H}";B=new_tmp_file()
	try:download(C,B);return load_file(B,mode='rb')
	except Exception as D:raise Exception(f"Failed to download Cloud Pod from URL {C}: {D}")from D
	finally:rm_rf(B)
def reset_state(services=_A):
	B=services
	def C(_url):
		A=requests.post(_url)
		if not A.ok:LOG.debug('Reset call to %s failed: status code %s',_url,A.status_code);raise Exception('Failed to reset LocalStack')
	if not B:A=f"{config.external_service_url()}/_localstack/state/reset";C(A);return
	for D in B:A=f"{config.external_service_url()}/_localstack/state/{D}/reset";C(A)
def get_ls_version_from_health():
	try:A=f"{config.external_service_url()}/_localstack/health";B=requests.get(A).json();return B[_E]
	except Exception:return''
def create_platform_url(path=_A,api_endpoint=_A):
	B=api_endpoint;A=path;B=B or constants.API_ENDPOINT;C=f"{B}/cloudpods"
	if not A:return C
	A=A if A.startswith('/')else f"/{A}";return f"{C}{A}"