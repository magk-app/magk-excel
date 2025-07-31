_K='Summary'
_J='--disable-pip-version-check'
_I='--no-color'
_H='--no-input'
_G='extension'
_F='name'
_E='pip'
_D='log'
_C='status'
_B='message'
_A='event'
import inspect,logging,os,subprocess
from pathlib import Path
from typing import Any,Dict,Generator,Literal,Optional,TypedDict
from localstack import config,constants
from localstack.utils.objects import singleton_factory
from localstack.utils.venv import VirtualEnvironment
from plugin import PluginManager
LOG=logging.getLogger(__name__)
LOCALSTACK_VENV=VirtualEnvironment(constants.LOCALSTACK_VENV_FOLDER)
VENV_DIRECTORY='extensions/python_venv'
def get_extensions_venv():return VirtualEnvironment(os.path.join(config.dirs.var_libs,VENV_DIRECTORY))
@singleton_factory
def get_extension_repository():return ExtensionsRepository(init_extension_venv())
def init_extension_venv():
	A=get_extensions_venv()
	if not A.exists:LOG.info('initializing extension environment at %s',A.venv_dir);A.create();LOG.debug('adding localstack venv path %s to %s',LOCALSTACK_VENV,A.venv_dir);A.add_pth('localstack-venv',LOCALSTACK_VENV)
	return A
def list_extension_metadata():from localstack.extensions.api import Extension as A;return list_plugin_distribution_data(PluginManager(A.namespace))
def list_plugin_distribution_data(plugin_manager):
	C=[]
	for A in plugin_manager.list_containers():
		try:D=A.distribution
		except ValueError:continue
		except Exception as F:LOG.error('Error while resolving distribution for plugin %s: %s. This probably means that the package was removed or otherwise changed after the plugin was loaded. Restarting LocalStack should fix the issue.',A.name,F);continue
		if not D:continue
		E=A.plugin_spec;B=inspect.getmodule(A.plugin_spec.factory);G={'namespace':E.namespace,_F:A.name,'factory':{'module':str(B.__name__),'code':f"{B.__name__}.{E.factory.__name__}",'file':str(B.__file__)},'distribution':D.metadata.json};C.append(G)
	return C
class InstallerEvent(TypedDict,total=False):event:Literal[_C,_D,'error','exception',_E,_G];message:str;extra:Optional[Dict[str,Any]]
class ExtensionsRepository:
	venv:VirtualEnvironment
	def __init__(A,venv=None):A.venv=venv or get_extensions_venv();A.venv.inject_to_sys_path()
	@property
	def pip(self):
		A=self.venv.venv_dir/'bin'/_E
		if not A.exists():raise FileNotFoundError(f"pip is not available at {self.pip}")
		return A
	def pip_show(A,package):
		B=[A.pip,'show',package]
		try:C=subprocess.check_output(B,stderr=subprocess.STDOUT,text=True);return{A:B for(A,B)in[A.split(': ',maxsplit=1)for A in C.splitlines()]}
		except subprocess.CalledProcessError as D:
			if'not found'in D.output:return
			raise
	def run_install(C,name_or_url):
		B=name_or_url;G=[C.pip,_H,_I,_J,'install',B];yield{_A:_C,_B:'Checking installed extensions'};A=C.pip_show(B)
		if A:yield{_A:_D,_B:f"Extension {A['Name']} ({A[_K]} by {A['Author']}) already installed"};return
		_clear_plugin_cache();H={A[_F]:A for A in list_extension_metadata()};yield{_A:_C,_B:'Installing extension'};D=False
		try:
			with SubprocessLineStream.open(G)as I:
				for E in I:
					yield{_A:_E,_B:E}
					if'No matching distribution found for'in E:D=True;yield{_A:'error',_B:f"Could not resolve package {B}, please check the URL or that the package exists in pypi."}
		except subprocess.CalledProcessError:
			if D:return
			raise
		_clear_plugin_cache();J={A[_F]:A for A in list_extension_metadata()};F=[B for(A,B)in J.items()if A not in H]
		if F:
			yield{_A:_D,_B:'Extension successfully installed'}
			for K in F:yield{_A:_G,_B:'','extra':K}
		else:yield{_A:_D,_B:'No change'}
		yield{_A:_C,_B:'Extension installation completed'}
	def run_uninstall(C,package):
		A=package;D=[C.pip,_H,_I,_J,'uninstall','-y',A];yield{_A:_C,_B:'Checking extensions'};B=C.pip_show(A)
		if not B:yield{_A:_D,_B:f"Extension {A} is not installed"};return
		yield{_A:_D,_B:f"Uninstalling extension {B['Name']} ({B[_K]})"};yield{_A:_C,_B:'Uninstalling extension'}
		with SubprocessLineStream.open(D)as E:
			for F in E:yield{_A:_E,_B:F}
		yield{_A:_D,_B:'Extension successfully uninstalled'};_clear_plugin_cache();yield{_A:_C,_B:'Extension uninstall completed'}
class SubprocessLineStream:
	default_timeout=5
	def __init__(A,process):A.process=process
	def __iter__(A):return A._gen()
	def _gen(A):
		C=A.process.stdout
		if A.process.text_mode:B='\r\n'
		else:B=b'\r\n'
		for D in C:yield D.rstrip(B)
		if A.process.wait(A.default_timeout)!=0:raise subprocess.CalledProcessError(returncode=A.process.returncode,cmd=A.process.args)
	def __enter__(A):return A
	def __exit__(A,exc_type,exc_val,exc_tb):A.close()
	def close(A):A.process.terminate()
	@classmethod
	def open(A,cmd,*B,**C):return A(subprocess.Popen(cmd,*B,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,**C))
def _clear_plugin_cache():from plugin.metadata import packages_distributions as A;from stevedore import ExtensionManager as B,_cache as C;C._c._internal.clear();B.ENTRY_POINT_CACHE.clear();A.cache_clear()