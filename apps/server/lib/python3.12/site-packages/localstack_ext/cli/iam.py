_D='Invalid response from the LocalStack instance.\nPlease update your LocalStack instance!'
_C='Unable to connect to the LocalStack Pro instance.\nPlease make sure you have an instance up and running!'
_B='Please perform request against LocalStack to start seeing policies here. Waiting for policies...'
_A='plain'
import json,subprocess
from typing import Any,Optional
import click,requests
from click import ClickException
from localstack import config
from localstack.cli import console
from localstack.utils.analytics.cli import publish_invocation
from localstack.utils.platform import is_windows
from localstack.utils.strings import to_str
from localstack_ext.cli.aws import aws
from localstack_ext.cli.cli import RequiresLicenseGroup
def _print_plain(generated_policy):A=generated_policy;console.print(f'Attached to {A["policy_type"]}: "{A["resource"]}"');console.line();console.print('Policy: ');console.print_json(data=A['policy_document']);console.line();console.rule();console.line()
def print_generated_policy_plain(generated_policy):A=generated_policy;A=json.loads(to_str(A));_print_plain(A)
def print_generated_policy_json(generated_policy):console.print(to_str(generated_policy),highlight=False)
def get_iam_endpoint():A=config.external_service_url();return f"{A}/_aws/iam"
@aws.group(name='iam',short_help='(Beta) Access LocalStack IAM features',help='\n    Access LocalStack IAM features.\n\n    This command provides tools to make it easier to write IAM policies for your cloud application.\n    ',cls=RequiresLicenseGroup)
def iam():0
@iam.command(name='stream',short_help='Stream policies for all requests enforced on LocalStack',help='\n    Live stream of policies as requests are coming into LocalStack.\n\n    This command generates a live stream of policies and the principals or resources they should be attached to.\n\n    For every request, it will print the principal or resource the policy should be attached to first.\n    (will be a service resource if it is a resource based policy, an IAM principal otherwise)\n    After that the recommended policy will be printed.\n    ')
@click.option('-f','--format','format_',type=click.Choice([_A,'json']),default=_A,help='The formatting style for the command output. Use plain if it should be human readable, and json to get a newline-separated list of json documents.')
@publish_invocation
def cmd_iam_stream(format_):
	A=format_
	try:
		with requests.get(f"{get_iam_endpoint()}/policies/stream",stream=True)as C:
			D=_B;console.print(D)
			for B in C.iter_lines():
				if A==_A:print_generated_policy_plain(B)
				elif A=='json':print_generated_policy_json(B)
	except requests.ConnectionError:raise ClickException(_C)
	except json.JSONDecodeError:raise ClickException(_D)
	except Exception as E:raise ClickException(f"Error while streaming Policies: {E}")
def clear_terminal():
	if is_windows():subprocess.run('cls')
	else:subprocess.run('clear')
@iam.command(name='summary',short_help='Summary of policies for all requests enforced on LocalStack',help='\n    Live view of all policies required for running your current stack on LocalStack\n\n    This command generates a live view of policies and the principals or resources they should be attached to.\n\n    This will clear your terminal.\n    The policies will update if a requests requires additional permissions for the principal making it.\n    ')
@click.option('-o','--output',help='File location to write the json output to.')
@click.option('--follow','-f',is_flag=True,default=False,help='Whether to continuously monitor the summary changes.')
@publish_invocation
def cmd_iam_summary(output,follow):
	D=output;A=None
	try:
		if follow:
			with requests.get(f"{get_iam_endpoint()}/policies/summary?stream=1",stream=True)as B:
				for A in B.iter_lines():
					clear_terminal();A=json.loads(to_str(A))
					if not A:console.print(_B)
					for C in A:_print_plain(C)
		else:
			B=requests.get(f"{get_iam_endpoint()}/policies/summary");A=B.json()
			if not A:console.print('No policies available yet. Please perform requests against LocalStack to get generated policies.')
			for C in A:_print_plain(C)
	except requests.ConnectionError:raise ClickException(_C)
	except json.JSONDecodeError:raise ClickException(_D)
	except Exception as E:raise ClickException(f"Error while streaming Policies: {E}")
	finally:
		if A and D:
			with open(D,mode='wt')as F:json.dump(A,fp=F)