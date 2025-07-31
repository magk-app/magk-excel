import click
from localstack_ext.cli.cli import RequiresLicenseGroup
@click.group(name='aws',short_help='Access additional functionality on LocalStack AWS Services',help='\n    Accesses additional functionality on LocalStack emulated AWS services.\n\n    This command provides tools to enhance your experience with certain emulated AWS services.\n    ',cls=RequiresLicenseGroup)
def aws():0