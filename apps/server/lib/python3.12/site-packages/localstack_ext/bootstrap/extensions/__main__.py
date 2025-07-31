_C='traceback'
_B='exception'
_A='message'
import json,os,traceback,click
from localstack import config
from.import repository
@click.group('extensions')
def cli():from localstack.utils.bootstrap import setup_logging as A;A()
@cli.command('debug')
def debug():
	B='not initialized';click.echo('Directories');click.echo('===========')
	for(C,D)in config.dirs.__dict__.items():click.echo(f"{C:13} {D}")
	click.echo();click.echo('Extensions venv');click.echo('===============');A=repository.LOCALSTACK_VENV;click.echo(f"localstack venv: {A.venv_dir}");click.echo(f"  site-packages: {A.site_dir if A.exists else B}");A=repository.get_extensions_venv();click.echo(f"extensions venv: {A.venv_dir}");click.echo(f"  site-packages: {A.site_dir if A.exists else B}");click.echo();click.echo('pip list');click.echo('========');os.system(f"bash -c '. {A.venv_dir}/bin/activate && pip list'")
@cli.command('init')
def init():repository.init_extension_venv()
@cli.command('list')
def list_():
	for A in repository.list_extension_metadata():click.echo(json.dumps(A))
@cli.command('install')
@click.argument('name',required=True)
def install(name):
	try:
		A=repository.ExtensionsRepository()
		for B in A.run_install(name):click.echo(json.dumps(B))
	except Exception as C:click.echo(json.dumps({'event':_B,_A:f"Error while installing extension: {C}",'extra':{_C:traceback.format_exc()}}))
@cli.command('uninstall')
@click.argument('name',required=True)
def uninstall(name):
	try:
		A=repository.ExtensionsRepository()
		for B in A.run_uninstall(name):click.echo(json.dumps(B))
	except Exception as C:click.echo(json.dumps({'event':_B,_A:f"Error while uninstalling extension: {C}",'extra':{_C:traceback.format_exc()}}))
if __name__=='__main__':cli()