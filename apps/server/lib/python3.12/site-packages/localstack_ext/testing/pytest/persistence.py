_I='function'
_H='persistence_group'
_G='persistence_splits'
_F='persistence_validations'
_E='COVERAGE_FILE'
_D='snapshot'
_C=False
_B=True
_A=None
import copy,logging,os,tempfile,textwrap
from contextlib import contextmanager
from enum import Enum
from itertools import islice
from typing import Callable,List,Optional,Union
import pytest
from _pytest._code import ExceptionInfo
from _pytest._code.code import Code,filter_traceback
from _pytest.compat import get_real_func
from _pytest.config import Config,ExitCode,PytestPluginManager
from _pytest.config.argparsing import Parser
from _pytest.fixtures import FixtureRequest
from _pytest.main import Session
from _pytest.nodes import Item
from _pytest.runner import CallInfo
from localstack import config,constants
from localstack.dev.run.configurators import CoverageRunScriptConfigurator,CustomEntryPointConfigurator,DependencyMountConfigurator,EntryPointMountConfigurator,SourceVolumeMountConfigurator
from localstack.dev.run.paths import HostPaths
from localstack.testing.pytest.container import ENV_TEST_CONTAINER_MOUNT_SOURCES
from localstack.testing.snapshots import SnapshotSession
from localstack.testing.snapshots.transformer_utility import SNAPSHOT_BASIC_TRANSFORMER
from localstack.utils import files,sync
from localstack.utils.bootstrap import Container,ContainerConfigurators,RunningContainer
from localstack.utils.container_utils.container_client import ContainerClient,ContainerConfiguration,ContainerConfigurator,ContainerException,PortMappings,VolumeMappings
from localstack.utils.docker_utils import DOCKER_CLIENT
from localstack.utils.serving import Server
from localstack.utils.strings import short_uid
from localstack.utils.sync import poll_condition
from localstack_ext.config import ROOT_FOLDER
LOG=logging.getLogger(__name__)
COVERAGE_FILE_NAME='.coverage'
class LocalstackPersistenceMode(Enum):snapshot=_D;cloudpods='cloudpods'
class PersistenceSnapshotSession(SnapshotSession):
	def __init__(C,*A,**B):super().__init__(*A,**B)
	def _persist_state(A):0
	def _load_state(A):return{}
	@contextmanager
	def record_state(self):A=self;B=A.update;C=A.verify;A.update=_B;A.verify=_C;yield;A.recorded_state=A.observed_state;A.recorded_state=A._transform(A.recorded_state);A.observed_state={};A.called_keys.clear();A.update=B;A.verify=C
class PersistenceValidator:
	test:Item;function:Callable;snapshot:PersistenceSnapshotSession
	def __init__(A,test,function,snapshot):A.test=test;A.function=function;A.snapshot=snapshot
class PersistenceValidations:
	test:Item;validators:list[PersistenceValidator]
	def __init__(A,test,snapshot):A.test=test;A.validators=[];A.snapshot=snapshot
	def register(A,fn):A.validators.append(PersistenceValidator(A.test,fn,A.snapshot))
	def run_setup(A):
		with A.snapshot.record_state():
			for B in A.validators:B.function()
	def match(A,key,value):return A.snapshot.match(key,value)
class PersistenceValidationsItem(Item):
	test:Item;validations:PersistenceValidations
	def __init__(A,parent,name,test,validations):super().__init__(parent=parent,name=name);A.own_markers=list(test.own_markers);A.test=test;A.validations=validations;A.funcargs={};A.failed_validator=_A
	def reportinfo(A):return A.fspath,A.validations.test.reportinfo()[1],A.name
	def runtest(A):
		D=_B;B=[];E=A.validations.test
		for F in E.iter_markers(name='skip_snapshot_verify'):G=F.kwargs.get('paths',[]);B.extend(G)
		for C in A.validations.validators:
			try:C.function()
			except Exception:A.failed_validator=C;raise
		A.validations.snapshot._assert_all(D,B)
	def _prunetraceback(B,excinfo):
		G='auto';C=excinfo
		if B.config.getoption('fulltrace',_C):return
		if not B.failed_validator:return
		E=Code.from_function(get_real_func(B.failed_validator.function));F,H=E.path,E.firstlineno;D=C.traceback;A=D.cut(path=F,firstlineno=H)
		if A==D:
			A=A.cut(path=F)
			if A==D:
				A=A.filter(filter_traceback)
				if not A:A=D
		C.traceback=A.filter()
		if B.config.getoption('tbstyle',G)==G:
			if len(C.traceback)>2:
				for I in C.traceback[1:-1]:I.set_repr_style('short')
class RestartLocalstack(Item):
	funcargs={}
	def runtest(A):
		match A.config.option.persistence_mode:
			case LocalstackPersistenceMode.snapshot:B=A._persistence_restore()
			case LocalstackPersistenceMode.cloudpods:B=A._cloudpods_restore()
			case _:B=A._persistence_restore()
		with B:
			try:persistence_session.restart_localstack()
			except Exception:A.session.shouldfail=_B;raise
	@contextmanager
	def _persistence_restore(self):yield
	@contextmanager
	def _cloudpods_restore(self):from localstack_ext.bootstrap.pods_client import CloudPodsLocalService as C;D=os.path.abspath(persistence_session.localstack_session.tmp_dir);A=f"file:{D}/test-pod-{short_uid()}.zip";B=C();B.export_pod(target=A);yield;B.import_pod(source=A)
class LocalstackSession:
	def __init__(A,persistence_mode,port=constants.DEFAULT_PORT_EDGE,tmp_dir=_A):A.port=port;A.tmp_dir=tmp_dir or tempfile.mkdtemp(prefix='localstack-pytest-');A.volume_dir=os.path.join(A.tmp_dir,'localstack-volume');A.persistence_mode=persistence_mode;A.server=_A;A.env_vars={}
	def start(A,timeout):
		B=timeout
		if A.server:return
		A.server=A._create_localstack_server();A.server.start()
		if not A.server.wait_is_up(timeout=B):raise TimeoutError(f"gave up waiting for localstack startup after {B} seconds")
	def stop(A,timeout):
		B=timeout
		if not A.server:return
		A.server.shutdown()
		def C():
			try:return not A.server.health()
			except Exception:return _C
		if not sync.poll_condition(C,timeout=B):raise TimeoutError(f"gave up waiting for localstack stop after {B} seconds")
		A._extract_current_coverage_file()
	def _extract_current_coverage_file(B):
		A=os.path.join(B.volume_dir,COVERAGE_FILE_NAME)
		if not os.path.exists(A):return
		C=os.getenv(_E,'.coverage.persistence');D=os.path.join(ROOT_FOLDER,C);files.cp_r(A,D)
	def restart(A,timeout):B=timeout;A.stop(B);A.server=_A;A.start(B)
	def close(A):
		try:files.rm_rf(A.volume_dir)
		except Exception as B:LOG.warning('could not delete temporary localstack volume dir %s: %s',A.volume_dir,B)
	def _create_localstack_server(A):B=A.persistence_mode==LocalstackPersistenceMode.snapshot;C={**A.env_vars,'PERSISTENCE':'1'if B else'0'};return LocalstackDevContainerServer(volume_dir=A.volume_dir,port=A.port,env=C)
class PersistenceSession:
	validations:dict[str,PersistenceValidations];validations_items:dict[str,PersistenceValidationsItem]
	def __init__(A):A.validations={};A.validations_items={};A.config=_A;A.session=_A;A.localstack_session=_A;A.default_localstack_timeout=60*2
	def configure(B,config):A=config;B.config=A;C=A.option.persistence_mode or LocalstackPersistenceMode.snapshot;D=str(A._tmp_path_factory.mktemp('localstack-persistence-tests-',numbered=_B));B.localstack_session=LocalstackSession(C,tmp_dir=D)
	def stop_localstack(A):A.localstack_session.stop(timeout=A.default_localstack_timeout)
	def start_localstack(A):A.localstack_session.start(timeout=A.default_localstack_timeout)
	def restart_localstack(A):A.localstack_session.restart(timeout=A.default_localstack_timeout)
	def register_test(B,test):A=test;E=B._new_snapshot_session(A);C=PersistenceValidations(A,E);D=PersistenceValidationsItem.from_parent(parent=A.parent,name=f"{A.name}[persistence_validations]",test=A,validations=C);B.validations[A.nodeid]=C;B.validations_items[A.nodeid]=D;return D
	def _new_snapshot_session(C,item):A=item;B=PersistenceSnapshotSession(file_path=os.path.join(os.path.relpath(A.fspath.dirname,ROOT_FOLDER),f"{A.fspath.purebasename}.snapshot.json"),scope_key=A.nodeid,update=_C,verify=_B);B.add_transformer(SNAPSHOT_BASIC_TRANSFORMER,priority=2);return B
	def is_persistence_test(A,item):
		if _F not in item._fixtureinfo.argnames:return _C
		return _B
	def close(A):
		if(B:=A.localstack_session):B.close()
class LocalstackDevContainerServer(Server):
	entrypoint=textwrap.dedent('\n        #!/bin/bash\n\n        # we re-use the extension venv to install coverage lazily (TODO: use a python package and lpm)\n        .venv/bin/python -m localstack_ext.bootstrap.extensions init\n        /var/lib/localstack/lib/extensions/python_venv/bin/pip install coverage[toml]\n\n        # then we run a single localstack runtime process wrapped with coverage\n        .venv/bin/python bin/coverage-run.py run --source localstack_ext -m localstack.runtime.main\n        ')
	def __init__(A,volume_dir,port=constants.DEFAULT_PORT_EDGE,env=_A,container_client=DOCKER_CLIENT,mount_source_files=_A):B=mount_source_files;super().__init__(port);A.container_name=f"ls-dev-{short_uid()}";A.volume_dir=volume_dir;A.env=env or{};A.container_client=container_client;A.container_config=ContainerConfiguration('localstack/localstack-pro',volumes=VolumeMappings(),ports=PortMappings('127.0.0.1'),env_vars=dict());A._container=_A;A.mount_source_files=B if B is not _A else config.is_env_not_false(ENV_TEST_CONTAINER_MOUNT_SOURCES)
	def _get_container_configurators(A):
		E='GITHUB_API_TOKEN';D='LOCALSTACK_API_KEY';B=HostPaths(workspace_dir=os.path.abspath(os.path.join(constants.LOCALSTACK_VENV_FOLDER,'..','..')),volume_dir=A.volume_dir);C=[ContainerConfigurators.env_vars({D:os.getenv(D,'test'),'ACTIVATE_PRO':'1',_E:f"/var/lib/localstack/{COVERAGE_FILE_NAME}",'RDS_MYSQL_DOCKER':'1','MSSQL_ACCEPT_EULA':'Y','LAMBDA_INIT_POST_INVOKE_WAIT_MS':'50',E:os.getenv(E),'GATEWAY_LISTEN':f":{A.port},:4566,:443"if A.port!=4566 else':4566,:443'}),ContainerConfigurators.container_name(A.container_name),ContainerConfigurators.debug,ContainerConfigurators.port(A.port),ContainerConfigurators.service_port_range,ContainerConfigurators.mount_localstack_volume(A.volume_dir),ContainerConfigurators.mount_docker_socket,CoverageRunScriptConfigurator(host_paths=B),CustomEntryPointConfigurator(A.entrypoint),ContainerConfigurators.env_vars(A.env)]
		if A.mount_source_files:C.append(SourceVolumeMountConfigurator(host_paths=B,pro=_B));C.append(EntryPointMountConfigurator(host_paths=B,pro=_B));C.append(DependencyMountConfigurator(host_paths=B,pro=_B))
		return C
	def _get_coverage_file_path_on_host(A):return os.path.join(A.volume_dir,COVERAGE_FILE_NAME)
	def do_run(A):
		B=Container(copy.deepcopy(A.container_config),A.container_client);B.configure(A._get_container_configurators());A._container=B.start();A._container.wait_until_ready()
		for C in A._container.stream_logs():A._log_listener(C.decode('utf-8'))
	def _log_listener(A,line,**B):print(f"{A.container_name}: {line.rstrip()}")
	def _terminate_coverage(A):A.container_client.exec_in_container(A.container_name,['bash','-c','pkill -f coverage-run.py']);poll_condition(lambda:os.path.exists(A._get_coverage_file_path_on_host()),timeout=10)
	def is_container_running(A):
		if not A._container:return _C
		return A._container.is_running()
	def do_shutdown(A):
		try:A._terminate_coverage();A._container.shutdown(timeout=10)
		except ContainerException:pass
	def is_up(A):
		if not A.is_container_running():return _C
		B=A._container.get_logs()
		if constants.READY_MARKER_OUTPUT not in B.splitlines():return _C
		return super().is_up()
persistence_session=PersistenceSession()
class PersistenceTestPlugin:
	@pytest.hookimpl()
	def pytest_addoption(self,parser,pluginmanager):A=parser;A.addoption('--persistence-splits',dest=_G,type=int,help='The number of groups to split the tests into');A.addoption('--persistence-group',dest=_H,type=int,help='The group of tests that should be executed (first one is 1)');A.addoption('--persistence-mode',type=LocalstackPersistenceMode,choices=list(LocalstackPersistenceMode))
	@pytest.hookimpl(tryfirst=_B)
	def pytest_cmdline_main(self,config):
		C=config;B=C.getoption(_H);A=C.getoption(_G)
		if A is _A and B is _A:return
		if A and B is _A:raise pytest.UsageError('argument `--persistence-group` is required')
		if B and A is _A:raise pytest.UsageError('argument `--persistence-splits` is required')
		if A<1:raise pytest.UsageError('argument `--persistence-splits` must be >= 1')
		if B<1 or B>A:raise pytest.UsageError(f"argument `--persistence-group` must be >= 1 and <= {A}")
	@pytest.hookimpl(trylast=_B)
	def pytest_configure(self,config):persistence_session.configure(config)
	@pytest.hookimpl(trylast=_B)
	def pytest_sessionstart(self,session):persistence_session.start_localstack()
	@pytest.hookimpl()
	def pytest_sessionfinish(self,session):persistence_session.stop_localstack();persistence_session.close()
	@pytest.hookimpl()
	def pytest_collection_modifyitems(self,session,config,items):
		C=config;A=items;D=C.option.persistence_group;E=C.option.persistence_splits
		if E and D:F=[A.name for A in split_list(lst=A,n=E)[D-1]];A[:]=[A for A in A if A.name in F]
		for B in A:
			if not persistence_session.is_persistence_test(B):continue
			persistence_session.register_test(B);B.name=f"{B.name}[setup]"
		A.append(RestartLocalstack.from_parent(parent=session,name='restart_localstack'))
		for B in persistence_session.validations_items.values():A.append(B)
	@pytest.hookimpl(hookwrapper=_B)
	def pytest_runtest_call(self,item):
		B=yield
		if item.nodeid not in persistence_session.validations:return
		A=persistence_session.validations[item.nodeid];A.run_setup()
	@pytest.fixture(name=_F,scope=_I)
	def fixture_persistence_validations(self,request):
		A=request
		if(B:=persistence_session.validations.get(A.node.nodeid)):return B
		raise ValueError(f"Node {A.node.nodeid} not registered in persistence session")
	@pytest.fixture(name=_D,scope=_I)
	def fixture_persistence_snapshot(self,request):
		A=request
		if(B:=persistence_session.validations.get(A.node.nodeid)):return B.snapshot
		raise ValueError(f"Node {A.node.nodeid} not registered in persistence session, cannot use snapshot")
def split_list(lst,n=0):
	A=lst
	if n==0:return[A]
	if n<0:raise ValueError('Number of parts (n) must be greater than 0')
	C=len(A)//n;F=len(A)%n;B=0;D=[]
	for G in range(n):E=C+1 if G<F else C;D.append(list(islice(A,B,B+E)));B+=E
	return D