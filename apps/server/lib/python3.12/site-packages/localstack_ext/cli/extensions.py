from __future__ import annotations
_N='uninstall'
_M='install'
_L='Initializing'
_K='extensions-dev.json'
_J='list'
_I='init'
_H='VERBOSE'
_G='host_path'
_F='name'
_E=False
_D='localstack_ext.bootstrap.extensions'
_C='-m'
_B=True
_A='extensions'
import json,os
from typing import Iterable,List,Union
import click
from click import ClickException
from localstack.cli import console
from localstack.utils.analytics.cli import publish_invocation
from localstack.utils.container_utils.container_client import ContainerConfiguration,ContainerConfigurator,ContainerException,VolumeBind
from rich.status import Status
from rich.table import Table
from.cli import RequiresLicenseGroup
_PYTHON_IN_CONTAINER='/opt/code/localstack/.venv/bin/python'
@click.group(name=_A,short_help='(Beta) Manage LocalStack extensions',help='\n    (Beta) Manage LocalStack extensions.\n\n    LocalStack Extensions allow developers to extend and customize LocalStack.\n    The feature and the API are currently experimental and may be subject to change.\n\n    If you are using LocalStack extensions with docker-compose, you can use the CLI by pointing the\n    `LOCALSTACK_VOLUME_DIR=` variable to localstack volume directory on your host. By default, the volume\n    on your host is located in `~/.cache/localstack` on Linux, and `~/Library/Caches` on Mac.\n\n    Visit https://docs.localstack.cloud/references/localstack-extensions/ for more information on LocalStack\n    Extensions.\n    ',cls=RequiresLicenseGroup)
@click.pass_context
@click.option('-v','--verbose',is_flag=_B,default=_E,help='Print more output')
def extensions(ctx,verbose):ctx.ensure_object(dict);ctx.obj[_H]=verbose
@extensions.command(_I,help='\n    Initialize the LocalStack extensions environment.\n\n    The environment variable `LOCALSTACK_VOLUME_DIR` currently defaults to ~/.cache/localstack, where the\n    extension environment will be installed into ./lib/extensions/\n    ')
@publish_invocation
def cmd_extensions_init():
	for A in _stream_localstack_container_command([_PYTHON_IN_CONTAINER,_C,_D,_I]):console.log(A)
@extensions.command(_M,help='\n    Install a LocalStack extension.\n\n    This command installs a LocalStack extension, where the name can be any valid pip dependency\n    identifier. Additionally, we support the installation of distribution files from disk, which you can\n    indicate by a ``file://`` prefix in the name\n\n    \x08\n    Example invocations:\n        localstack extensions install localstack-extension-stripe\n        localstack extensions install "git+https://github.com/localstack/localstack-stripe.git#egg=localstack-stripe"\n        localstack extensions install file://./dist/localstack-extension-hello-world-0.1.0.tar.gz\n    ')
@click.pass_context
@click.argument(_F,required=_B)
@publish_invocation
def cmd_extensions_install(ctx,name):
	B=name;C=[]
	if B.startswith('file://'):
		A=B[7:]
		if not os.path.exists(A):raise ClickException(f"No such file {A}")
		A=os.path.abspath(A)
		if not os.path.isfile(A):raise ClickException(f"{A} is a directory, expected a file")
		B=f"/tmp/{os.path.basename(A)}";C.append(lambda cfg:cfg.volumes.add(VolumeBind(A,B)))
	D=console.status(_L)
	with D:_ensure_venv_initialized();E=_stream_localstack_container_command([_PYTHON_IN_CONTAINER,_C,_D,_M,B],C);_process_extensions_event_stream(E,D,ctx.obj[_H])
@extensions.command(_N,help='\n    Remove a LocalStack extension.\n\n    This command removes a previously installed LocalStack extension, where the name can be any valid package name.\n\n    \x08\n    Example invocations:\n        localstack extensions uninstall localstack-extension-stripe\n    ')
@click.pass_context
@click.argument(_F,required=_B)
@publish_invocation
def cmd_extensions_uninstall(ctx,name):
	A=console.status(_L)
	with A:_ensure_venv_initialized();B=_stream_localstack_container_command([_PYTHON_IN_CONTAINER,_C,_D,_N,name]);_process_extensions_event_stream(B,A,ctx.obj[_H])
@extensions.command(_J,help='\n    List installed extension.\n\n    The environment variable `LOCALSTACK_VOLUME_DIR` currently defaults to ~/.cache/localstack, where the\n    extension environment will be installed into ./lib/extensions/\n    ')
@publish_invocation
def cmd_extensions_list():
	D=[_PYTHON_IN_CONTAINER,_C,_D,_J];B=console.status('Querying ...');B.start()
	try:
		E=_stream_localstack_container_command(D);C=[]
		for A in E:
			A=A.strip()
			if not A:continue
			F=json.loads(A);C.append(F)
		B.stop();console.print(_extension_metadata_table(C))
	finally:B.stop()
def _ensure_venv_initialized():
	try:_assert_venv_initialized()
	except ClickException:
		for A in _stream_localstack_container_command([_PYTHON_IN_CONTAINER,_C,_D,_I]):console.log(A)
	_assert_venv_initialized()
def _assert_venv_initialized():
	from localstack import config as A;from localstack_ext.bootstrap.extensions import repository as B;C=os.path.join(A.VOLUME_DIR,'lib',B.VENV_DIRECTORY)
	if not os.path.exists(C):raise ClickException('extensions dir not initialized, please run `localstack extensions init` first or check if `LOCALSTACK_VOLUME_DIR` is set correctly')
def _process_extensions_event_stream(stream,status,verbose):
	I="couldn't parse container response";G='extra';F=verbose;E='message';B='event';D=[];H=_E
	for C in stream:
		try:
			if isinstance(C,dict):A=C
			else:A=json.loads(C)
		except json.JSONDecodeError:console.log(I,C);continue
		if B not in A:console.log(I,C)
		elif A[B]=='status':status.update(A[E])
		elif A[B]=='log':console.log(A[E])
		elif A[B]=='error':console.log('Error:',A[E])
		elif A[B]=='pip':
			if F:console.log(A[E])
		elif A[B]=='extension':D.append(A[G])
		elif A[B]=='exception':
			console.log(A[E]);H=_B
			if F and G in A:console.log(A[G].get('traceback'))
		else:console.log('unknown event type in container response',C)
	if H and not F:console.log('An error occurred while processing the extension. You can run the the extensions command again with the --verbose flag to get more information about the error.')
	D=[A for A in D if A]
	if D:console.print(_extension_metadata_table(D))
def _extension_metadata_table(extensions_):
	C='distribution';A=Table();A.add_column('Name');A.add_column('Summary');A.add_column('Version');A.add_column('Author');A.add_column('Plugin name')
	for B in extensions_:A.add_row(B[C][_F],B[C]['summary'],B[C]['version'],B[C]['author'],B[_F])
	return A
@extensions.group('dev')
def dev():0
@dev.command('new',help='\n    Create a new LocalStack extension from the official extension template.\n\n    \x08\n    The templating relies on cookiecutter, which you can install with\n        pip install cookiecutter\n\n    \x08\n    The template can be found at\n    https://github.com/localstack/localstack-extensions/tree/main/template.\n\n    The new extension will be created in your current working directory under the <project_slug> parameter.\n    ')
@publish_invocation
def cmd_dev_new():
	try:from cookiecutter.main import cookiecutter as A
	except ImportError:B='this command requires the cookiecutter CLI, please run:\npip install cookiecutter';raise ClickException(B)
	A('https://github.com/localstack/localstack-extensions',directory='template')
@dev.command('enable',help='\n    Enables an extension on the host for developer mode.\n\n    Extensions for which dev mode is enabled will be mounted into the LocalStack container the next time it runs.\n\n        PATH: the path to the extension (can be relative).\n    ')
@click.argument('path',type=click.Path(exists=_B))
@publish_invocation
def cmd_dev_enable(path):
	B=path;from localstack import config as A;from localstack.utils.json import FileMappedDocument as C;B=os.path.abspath(B);A=C(os.path.join(A.CONFIG_DIR,_K))
	if _A not in A:A[_A]=[]
	for D in A[_A]:
		if D[_G]==B:click.echo(f"{B} already enabled");return
	A[_A].append({_G:B});A.save();click.echo(f"{B} enabled")
@dev.command('disable',help='\n    Disables an extension on the host for developer mode.\n\n    Extensions for which dev mode is enabled will be mounted into the LocalStack container the next time it runs.\n\n        PATH: the path to the extension (can be relative).\n    ')
@click.argument('path',type=click.Path(exists=_E))
@publish_invocation
def cmd_dev_disable(path):
	B=path;from localstack import config as A;from localstack.utils.json import FileMappedDocument as C;B=os.path.abspath(B);A=C(os.path.join(A.CONFIG_DIR,_K))
	if _A not in A:A[_A]=[]
	D=len(A[_A]);A[_A]=[A for A in A[_A]if A[_G]!=B];E=len(A[_A])
	if D==E:click.echo(f"{B} not enabled");return
	A.save();click.echo(f"{B} disabled")
@dev.command(_J,help='\n    List LocalStack extensions for which dev mode is enabled.\n    ')
def cmd_dev_list():
	from localstack import config as A;from localstack.utils.json import FileMappedDocument as B;A=B(os.path.join(A.CONFIG_DIR,_K))
	if _A not in A:return
	for C in A[_A]:click.echo(C[_G])
def _stream_localstack_container_command(cmd,additional_configurators=()):
	from localstack import config as F,constants as G;from localstack.utils import docker_utils as H;from localstack.utils.bootstrap import Container as I,ContainerConfigurators as B;from localstack_ext.bootstrap import licensingv2 as J;C=I(ContainerConfiguration(image_name=G.DOCKER_IMAGE_NAME_PRO,remove=_E),docker_client=H.DOCKER_CLIENT);K=[B.env_vars({'DEBUG':'0'}),B.custom_command(cmd),B.mount_localstack_volume(F.VOLUME_DIR),J.configure_container_licensing,*additional_configurators];C.configure(K);A=C.start()
	try:
		L=A.stream_logs()
		for M in L:yield M.decode('utf-8')
		N=A.inspect();D=N['State']['ExitCode']
		if D!=0:E=A.get_logs();console.log(E);raise ContainerException(f"container returned with a non-zero exit code {D}",stdout=E)
	finally:A.shutdown(remove=_B)