_B='--services'
_A=None
import json
from typing import Optional
import click
from localstack.cli import console
from localstack.cli.exceptions import CLIError
from localstack.utils.analytics.cli import publish_invocation
from localstack.utils.collections import is_comma_delimited_list
from localstack_ext.bootstrap.pods_client import CloudPodsLocalService
from localstack_ext.cli.cli import RequiresLicenseGroup,_assert_host_reachable
@click.group(name='state',short_help='(Beta) Export, restore, and reset LocalStack state.',help="\n    (Beta) Manage and manipulate the localstack state.\n\n    The state command group allows you to interact with LocalStack's state backend.\n\n    Read more: https://docs.localstack.cloud/references/persistence-mechanism/#snapshot-based-persistence\n    ",cls=RequiresLicenseGroup)
def state():0
@state.command(name='reset',short_help='Reset the state of LocalStack services',help='\n    Reset the service states of the current LocalStack runtime.\n\n    This command invokes a reset of services in the currently running LocalStack container.\n    By default, all services are rest. The `services` options allows to select a subset of services\n    which should be reset.\n\n    This command tries to automatically discover the running LocalStack instance.\n    If LocalStack has not been started with `localstack start` (and is not automatically discoverable),\n    please set `LOCALSTACK_HOST`.\n    ')
@click.option('-s',_B,help='Comma-delimited list of services to reset. By default, the state of all running services is reset.')
@publish_invocation
def reset(services):
	A=services;from localstack_ext.bootstrap import pods_client as B
	if A and not is_comma_delimited_list(A):raise click.ClickException('Input the services as a comma-delimited list')
	C=[A.strip()for A in A.split(',')]if A else _A;B.reset_state(services=C);console.print('LocalStack state successfully reset')
@state.command(name='export',short_help='Export the state of LocalStack services',help='\n    Save the current state of the LocalStack container to a file on the local disk. This file can be restored at any\n    point in time using the `localstack state import` command. Please be aware that this might not be possible when\n    importing the state with a different version of LocalStack.\n\n    If you are looking for a managed solution to handle the state of your LocalStack container, please check out\n    the Cloud Pods feature: https://docs.localstack.cloud/user-guide/tools/cloud-pods/\n\n    Use the DESTINATION argument to specify an absolute path for the exported file or a filename in current working\n    directory.\n    If no destination is specified, a file named `ls-state-export` will be saved in the current working directory.\n\n    \x08\n    Examples:\n        localstack state export my-state\n        localstack state export /home/johndoe/my-state\n\n    You can also specify a subset of services to export. By default, the state of all running services is exported.\n    ')
@click.argument('destination',type=click.Path(),default='ls-state-export')
@click.option('-s',_B,help='Comma-delimited list of services to reset. By default, the state of all running services is exported.')
@click.option('-f','--format','format_',type=click.Choice(['json']),help='The formatting style for the save command output.')
@publish_invocation
def export(destination,services=_A,format_=_A):
	A=destination;_assert_host_reachable();C=StateToPodAdapter()
	try:
		D=C.export_pod(target=A,services=services)
		if format_=='json':console.print_json(json.dumps(D))
		else:console.print(f"LocalStack state successfully exported to {A} ✅")
		return
	except Exception as B:raise CLIError(f"Failed to export LocalStack state - {B}")from B
@state.command(name='import',short_help='Import the state of LocalStack services',help='\n    Load the state of LocalStack from a file into the running container.\n    The SOURCE file must have been generated from a previous `localstack state export` command.\n    Please be aware that it might not be possible to import a state generated from a different version of LocalStack.\n\n    \x08\n    Examples:\n        localstack state import my-state\n        localstack state import /home/johndoe/my-state\n    ')
@click.argument('source',type=click.Path(exists=True))
@publish_invocation
def import_state(source):
	A=source;_assert_host_reachable();B=StateToPodAdapter();C=B.import_pod(source=A)
	if C:console.print(f"LocalStack state successfully imported from {A} ✅");return
	else:raise CLIError(f"Failed to import LocalStack state from {A}")
class StateToPodAdapter:
	client:0
	def __init__(A):A.client=CloudPodsLocalService()
	def export_pod(A,target,services=_A):return A.client.export_pod(target=f"file://{target}",services=services)
	def import_pod(A,source):return A.client.import_pod(source=f"file://{source}")