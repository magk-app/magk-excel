import os.path,click
from localstack_ext.bootstrap.licensingv2 import AuthToken,DevLocalstackEnvironment,LicensingError,get_credentials_from_environment,get_licensed_environment
@click.group(name='license',short_help='(Beta) Manage and verify your LocalStack license',help='\n    (Beta) Manage and verify your LocalStack license.\n\n    Your LocalStack license allows you to use advanced features of LocalStack.\n    ')
def license():0
@license.command('info')
def cmd_info():
	I='test'
	try:A=get_credentials_from_environment()
	except Exception as B:click.echo(f"credentials: {B}");return
	if A:
		if isinstance(A,AuthToken):
			if A.encoded()==I:E=I
			else:E='valid syntax'if A.is_valid()else'invalid'
		else:E=''
		click.echo(f"credentials: {type(A).__name__}({A.encoded()}) {E}")
	else:click.echo('credentials: none found in environment')
	C=get_licensed_environment()
	if isinstance(C,DevLocalstackEnvironment):click.echo('test credentials used, using unlicensed dev environment');return
	D=None
	for G in C.get_license_file_read_locations():
		if os.path.isfile(G):D=G;break
	F=None
	if D:
		try:
			with open(D,'rb')as J:H=J.read();F=C.parser.parse(H);click.echo(f"license location: {D}");click.echo(f"license: {H.decode('utf-8')}")
		except LicensingError as B:click.echo(f"license location: {D}");click.echo(f"license: error reading license file {B}")
	if F:
		try:C.client.validate_license(C.require_valid_credentials(),F);click.echo('license validity: valid')
		except LicensingError as B:click.echo(f"license validity: invalid ({B})")
@license.command('activate')
def cmd_activate():
	try:A=get_licensed_environment();A.activate();click.echo('license activation completed');click.echo(f"license: {A.serializer.serialize(A.license).decode('utf-8')}")
	except LicensingError as B:click.echo(B.get_user_friendly())