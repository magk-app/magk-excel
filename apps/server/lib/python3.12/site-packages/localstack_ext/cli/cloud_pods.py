_N='curses'
_M='services'
_L='version'
_K='delete'
_J='format_'
_I='--format'
_H='-f'
_G='remote'
_F='table'
_E=True
_D=False
_C='name'
_B='json'
_A=None
import json,logging
from typing import Dict,List,Optional,Tuple
from urllib.parse import urlparse
import click
from localstack.cli import console
from localstack.cli.exceptions import CLIError
from localstack.utils.analytics.cli import publish_invocation
from localstack.utils.collections import is_comma_delimited_list
from localstack.utils.time import timestamp
from localstack_ext.bootstrap.auth import get_auth_cache
from localstack_ext.bootstrap.pods.api_types import DEFAULT_STRATEGY,MergeStrategy
from localstack_ext.bootstrap.pods.remotes.api import CloudPodsRemotesClient
from localstack_ext.bootstrap.pods.remotes.configs import RemoteConfigParams
from localstack_ext.bootstrap.pods_client import CloudPodRemoteAttributes,CloudPodsClient,list_public_pods
from localstack_ext.cli.cli import RequiresLicenseGroup,_assert_host_reachable
from localstack_ext.cli.click_utils import print_table
from localstack_ext.cli.tree_view import TreeRenderer
LOG=logging.getLogger(__name__)
DATE_FORMAT='%Y-%m-%d %H:%M:%S'
@click.group(name='pod',help='Manage the state of your instance via Cloud Pods.',context_settings=dict(max_content_width=120),cls=RequiresLicenseGroup if not get_auth_cache().get('token')else _A)
def pod():0
@pod.group(name=_G,help='Manage cloud pod remotes')
def remote():0
@remote.command(name='add',short_help='Add a remote',help='\n    Add a new remote for Cloud Pods.\n\n    A remote is the place where your Cloud Pods are stored. By default, Cloud Pods are store in the LocalStack platform.\n    ')
@click.argument(_C,required=_E)
@click.argument('url',required=_E)
def cmd_add_remote(name,url):
	A=name;_assert_host_reachable();C=CloudPodsRemotesClient();D=urlparse(url).scheme
	try:C.create_remote(name=A,protocols=[D],remote_url=url)
	except Exception as B:raise CLIError(f"Unable to determine URL for remote '{A}': {B}")from B
	console.print(f"Successfully added remote '{A}'")
@remote.command(name=_K,short_help='Delete a remote',help='Remove a remote for Cloud Pods.')
@click.argument(_C,required=_E)
def cmd_delete_remote(name):
	A=name;_assert_host_reachable();C=CloudPodsRemotesClient()
	try:C.delete_remote(name=A)
	except Exception as B:raise CLIError(f"Unable to delete remote '{A}': {B}")from B
	console.print(f"Successfully deleted remote '{A}'")
@remote.command(name='list',short_help='Lists the available remotes')
@click.option(_H,_I,_J,type=click.Choice([_F,_B]),default=_F,help='The formatting style for the remotes command output.')
def cmd_remotes(format_):
	_assert_host_reachable();B=CloudPodsRemotesClient();A=B.get_remotes()
	if not A:console.print('[yellow]No remotes[/yellow]');return
	if format_==_B:console.print_json(json.dumps(A));return
	print_table(column_headers=['Remote Name','URL'],columns=[[A[_C]for A in A],[A['url']for A in A]])
@pod.command(name=_K,short_help='Delete a Cloud Pod',help='\n    Delete a Cloud Pod registered on the remote LocalStack platform.\n\n    This command will remove all the versions of a Cloud Pod, and the operation is not reversible.\n    ')
@click.argument(_C)
@publish_invocation
def cmd_pod_delete(name):
	A=name;C=CloudPodsClient()
	try:C.delete(pod_name=A);console.print(f"Successfully deleted Cloud Pod '{A}'")
	except Exception as B:raise CLIError(f"Unable to delete Cloud Pod '{A}': {B}")from B
@pod.command(name='save',short_help='Create a new Cloud Pod',help="\n    Save the current state of the LocalStack container in a Cloud Pod.\n\n    A Cloud Pod can be registered and saved with different storage options, called remotes. By default, Cloud Pods\n    are hosted in the LocalStack platform. However, users can decide to store their Cloud Pods in other remotes, such as\n    AWS S3 buckets or ORAS registries.\n\n    An optional message can be attached to any Cloud Pod.\n    Furthermore, one could decide to export only a subset of services with the optional --service option.\n\n    \x08\n    To use the LocalStack platform for storage, the desired Cloud Pod's name will suffice, e.g.:\n\n    \x08\n    localstack pod save <pod_name>\n\n    Please be aware that each following save invocation with the same name will result in a new version being created.\n\n    \x08\n    To save a local copy of your state, you can use the 'localstack state export' command.\n    ")
@click.argument(_C)
@click.argument(_G,required=_D)
@click.option('-m','--message',help="Add a comment describing this Cloud Pod's version")
@click.option('-s','--services',help='Comma-delimited list of services to push in the Cloud Pod (all by default)')
@click.option('--visibility',type=click.Choice(['public','private']),help='Set the visibility of the Cloud Pod [`public` or `private`]. Does not create a new version')
@click.option(_H,_I,_J,type=click.Choice([_B]),help='The formatting style for the save command output.')
@publish_invocation
def cmd_pod_save(name=_A,remote=_A,services=_A,message=_A,visibility=_A,format_=_A):
	F=visibility;E=remote;B=services;A=name;G=CloudPodsClient();_assert_host_reachable()
	if B and not is_comma_delimited_list(B):raise CLIError('Input the services as a comma-delimited list')
	H=RemoteConfigParams(remote_name=E)if E else _A
	if F:
		try:G.set_remote_attributes(pod_name=A,attributes=CloudPodRemoteAttributes(is_public=_E),remote=H)
		except Exception as C:raise CLIError(str(C))
		console.print(f"Cloud Pod {A} made {F}")
	I=[A.strip()for A in B.split(',')]if B else _A
	try:D=G.save(pod_name=A,attributes=CloudPodRemoteAttributes(is_public=_D,description=message,services=I),remote=H)
	except Exception as C:raise CLIError(f"Failed to create Cloud Pod {A} ❌ - {C}")from C
	if format_==_B:console.print_json(json.dumps(D))
	else:console.print(f"Cloud Pod `{A}` successfully created ✅\nVersion: {D[_L]}\nRemote: {D[_G]}\nServices: {','.join(D[_M])or'none'}")
@pod.command(name='load',help="\n    Load the state of a Cloud Pod into the application runtime/\n    Users can import Cloud Pods from different remotes, with the LocalStack platform being the default one.\n\n    Loading the state of a Cloud Pod into LocalStack might cause some conflicts with the current state of the container.\n    By default, LocalStack will attempt a best-effort merging strategy between the current state and the one from the\n    Cloud Pod. For a service X present in both the current state and the Cloud Pod, we will attempt to merge states\n    across different accounts and regions. If the service X has a state for the same account and region both in the\n    running container and the Cloud Pod, the latter will be used. If a service Y is present in the running container\n    but not in the Cloud Pod, it will be left untouched.\n    With `--merge overwrite`, the state of the Cloud Pod will completely replace the state of the running container.\n\n    \x08\n    To load a local copy of a LocalStack state, you can use the 'localstack state import' command.\n    ")
@click.argument(_C)
@click.argument(_G,required=_D)
@click.option('--merge',type=click.Choice([A.value for A in MergeStrategy]),default=DEFAULT_STRATEGY,help='The merge strategy to adopt when loading the Cloud Pod')
@click.option('--yes','-y',help='Automatic yes to prompts. Assume a positive answer to all prompts and run non-interactively',is_flag=_E,default=_D)
@publish_invocation
def cmd_pod_load(name=_A,remote=_A,merge=_A,yes=_D):
	B=remote;A=name;D=CloudPodsClient();_assert_host_reachable()
	try:E,F=get_pod_name_and_version(A);G=RemoteConfigParams(remote_name=B)if B else _A;D.load(pod_name=E,remote=G,version=F,merge_strategy=merge,ignore_version_mismatches=yes)
	except Exception as C:raise CLIError(f"Failed to load Cloud Pod {A}: {C}")from C
	print(f"Cloud Pod {A} successfully loaded")
def get_pod_name_and_version(pod_name):
	A=pod_name
	if':'not in A:return A,_A
	C,D,B=A.rpartition(':')
	if B.isdigit():return C,int(B)
	return A,_A
@pod.command(name='list',short_help='List all available Cloud Pods',help='\n    List all the Cloud Pods available for a single user, or for an entire organization, if the user is part of one.\n\n    With the --public flag, it lists the all the available public Cloud Pods. A public Cloud Pod is available across\n    the boundary of a user ond/or organization. In other words, any public Cloud Pod can be injected by any other\n    user holding a LocalStack Pro (or above) license.\n    ')
@click.argument(_G,required=_D)
@click.option('--public','-p',help='List all the available public Cloud Pods',is_flag=_E,default=_D)
@click.option(_H,_I,_J,type=click.Choice([_F,_B]),default=_F,help='The formatting style for the list pods command output.')
@publish_invocation
def cmd_pod_list_pods(remote=_A,public=_D,format_=_A):
	C='last_change';B=remote;D=CloudPodsClient();_assert_host_reachable()
	if public:E=list_public_pods();print_table(column_headers=['Cloud Pod'],columns=[E]);return
	F=RemoteConfigParams(remote_name=B)if B else _A;A=D.list(remote=F)
	if not A:console.print('[yellow]No pods available[/yellow]')
	if format_==_B:console.print_json(json.dumps(A));return
	print_table(column_headers=['Name','Max Version','Last Change'],columns=[[A['pod_name']for A in A],[str(A['max_version'])for A in A],[timestamp(A[C],format=DATE_FORMAT)if A.get(C)else'n/a'for A in A]])
@pod.command(name='versions',help='\n    List all available versions for a Cloud Pod\n\n    This command lists the versions available for a Cloud Pod.\n    Each invocation of the save command is going to create a new version for a named Cloud Pod, if a Pod with\n    such name already does exist in the LocalStack platform.\n    ')
@click.argument(_C)
@click.option(_H,_I,_J,type=click.Choice([_F,_B]),default=_F,help='The formatting style for the version command output.')
@publish_invocation
def cmd_pod_versions(name,format_):
	C=CloudPodsClient();_assert_host_reachable()
	try:A=C.get_versions(pod_name=name)
	except Exception as B:raise CLIError(str(B))from B
	if not A:console.print('[yellow]No versions available[/yellow]')
	if format_==_B:console.print_json(json.dumps(A));return
	print_table(column_headers=['Version','Creation Date','LocalStack Version','Services','Description'],columns=[[str(A[_L])for A in A],[timestamp(A['created_at'],format=DATE_FORMAT)for A in A],[A['localstack_version']for A in A],[','.join(A[_M]or[])for A in A],[A['description']for A in A]])
@pod.command(name='inspect',help='\n    Inspect the contents of a Cloud Pod\n\n    This command shows the content of a Cloud Pod.\n    By default, it starts a curses interface which allows an interactive inspection of the contents in the Cloud Pod.\n')
@click.argument(_C)
@click.option(_H,_I,_J,type=click.Choice([_N,'rich',_B]),default=_N,help='The formatting style for the inspect command output.')
@publish_invocation
def cmd_pod_inspect(name,format_):
	B=CloudPodsClient()
	try:A=B.get_metamodel(pod_name=name,version=-1)
	except Exception:raise CLIError('Error occurred while fetching the metamodel')
	C=['cloudwatch']
	for(D,E)in A.items():A[D]={A:B for(A,B)in E.items()if A not in C}
	TreeRenderer.get(format_).render_tree(A)