_B='[red]Error:[/red] '
_A=True
import logging,sys
from typing import Any,Optional
import click
from localstack.cli import LocalstackCli,LocalstackCliPlugin,console
from localstack.utils.analytics.cli import publish_invocation
from.auth import auth
from.aws import aws
from.cli import RequiresLicenseGroup
from.cloud_pods import pod
from.extensions import extensions
from.iam import iam
from.license import license
from.state import state
class ProCliPlugins(LocalstackCliPlugin):
	name='pro'
	def attach(B,cli):A=cli.group;A.add_command(cmd_login);A.add_command(cmd_logout);A.add_command(dns);A.add_command(aws);A.add_command(extensions);A.add_command(license);A.add_command(state);A.add_command(auth);A.add_command(pod)
@click.command(name='login',short_help='Login to the LocalStack Platform',help='Login to your LocalStack account (Deprecated: please use `localstack auth login` instead)',deprecated=_A)
@click.pass_context
@click.option('-u','--username',help='Username for login',metavar='USER')
@click.option('-p','--password',help='Password for login',metavar='PWD')
@click.option('-s','--password-stdin',help='Read password from stdin',is_flag=_A,default=False)
@publish_invocation
def cmd_login(ctx,username,password,password_stdin):
	B=username;A=password;from localstack_ext.cli.auth import login
	if password_stdin:A=sys.stdin.read().strip()
	if A and not B:raise click.ClickException('Missing username')
	ctx.invoke(login,username=B,password=A)
@click.command(name='logout',short_help='Log out from the LocalStack Platform',help='Log out from the LocalStack Platform (Deprecated: please use `localstack auth logout` instead)',deprecated=_A)
@click.pass_context
@publish_invocation
def cmd_logout(ctx):from localstack_ext.cli.auth import logout as A;ctx.invoke(A)
@click.group(name='dns',short_help='Manage LocalStack DNS host config',help='\n    Manage the usage of the LocalStack DNS on your host.\n\n    This command provides tools to configure your the DNS on your host machine to use the LocalStack DNS\n    on your host machine.\n    The LocalStack DNS is used for certain Pro features (like the transparent endpoint injection).\n\n    \x08\n    Visit https://docs.localstack.cloud/user-guide/tools/transparent-endpoint-injection/dns-server/\n    for more information on the LocalStack DNS and how it is used.\n    ',cls=RequiresLicenseGroup)
def dns():0
@dns.command(name='systemd-resolved',short_help='Manage LocalStack DNS in systemd-resolved',help='\n        Manage the LocalStack DNS configuration using systemd-resolved (Ubuntu, Debian, etc.).\n\n        This command sets (or reverts) the LocalStack DNS, running in the current LocalStack runtime, in\n        systemd-resolved for the docker network interface.\n        Most current Linux systems - like Ubuntu, Debian, or Fedora - use systemd-resolved for the network name\n        resolution.\n    ')
@click.option('--set/--revert','-s/-r','set_',default=_A,help='Set or revert DNS settings')
@publish_invocation
def cmd_dns_systemd(set_):import localstack_ext.bootstrap.dns_utils;from localstack_ext.bootstrap.dns_utils import configure_systemd as A;console.print('Configuring systemd-resolved...');B=localstack_ext.bootstrap.dns_utils.LOG.name;localstack_ext.bootstrap.dns_utils.LOG=ConsoleLogger(B);A(not set_)
class ConsoleLogger(logging.Logger):
	def __init__(A,name):super(ConsoleLogger,A).__init__(name)
	def info(B,msg,*A,**C):console.print(msg%A)
	def warning(B,msg,*A,**C):console.print('[red]Warning:[/red] ',msg%A)
	def error(B,msg,*A,**C):console.print(_B,msg%A)
	def exception(B,msg,*A,**C):console.print(_B,msg%A);console.print_exception()