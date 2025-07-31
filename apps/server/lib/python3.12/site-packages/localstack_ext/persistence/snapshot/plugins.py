import logging
from localstack import config
from localstack.aws.handlers import serve_custom_service_request_handlers
from localstack.config import SNAPSHOT_FLUSH_INTERVAL
from localstack.runtime import hooks,shutdown
from localstack.utils.objects import singleton_factory
from localstack_ext import config as ext_config
LOG=logging.getLogger(__name__)
def is_persistence_activated():return config.PERSISTENCE and ext_config.ACTIVATE_PRO
@singleton_factory
def get_save_strategy():
	from localstack_ext.persistence.snapshot.api import SaveStrategy as A;B=A.SCHEDULED
	try:
		if config.SNAPSHOT_SAVE_STRATEGY:return A(config.SNAPSHOT_SAVE_STRATEGY)
	except ValueError as C:LOG.warning('Invalid save strategy, falling back to %s: %s',B,C)
	return B
@singleton_factory
def get_load_strategy():
	from localstack_ext.persistence.snapshot.api import LoadStrategy as A
	try:
		if config.SNAPSHOT_LOAD_STRATEGY:return A(config.SNAPSHOT_LOAD_STRATEGY)
	except ValueError as B:LOG.warning('Invalid load strategy, falling back to on_startup: %s',B)
	return A.ON_REQUEST
@singleton_factory
def get_service_state_manager():from localstack import config as A;from localstack.services.plugins import SERVICE_PLUGINS as B;from.manager import SnapshotManager as C;return C(B,A.dirs.data)
@hooks.on_infra_start(should_load=is_persistence_activated())
def register_state_resource():from localstack.services.internal import get_internal_apis as A;from.endpoints import StateResource as B;C=B(get_service_state_manager());A().add(C)
@hooks.on_infra_start(should_load=is_persistence_activated(),priority=1)
def register_state_load_strategy():
	B=get_load_strategy();from localstack_ext.persistence.snapshot.api import LoadStrategy as A;from localstack_ext.persistence.snapshot.manager import LoadOnRequestHandler as C
	match B:
		case A.ON_STARTUP:LOG.info('registering ON_STARTUP load strategy');return
		case A.ON_REQUEST:LOG.warning('registering ON_REQUEST load strategy: this strategy has known limitations to not restore state correctly for certain services');D=C(get_service_state_manager());serve_custom_service_request_handlers.append(D.on_request)
		case A.MANUAL:LOG.info('registering MANUAL load strategy (call /_localstack/state endpoints to load state)')
		case _:LOG.warning('Unknown load strategy %s',B)
@hooks.on_infra_ready(should_load=is_persistence_activated(),priority=-10)
def do_run_state_load_all():
	from localstack_ext.persistence.snapshot.api import LoadStrategy as A;B=get_load_strategy()
	if B==A.ON_STARTUP:LOG.info('restoring state of all services');get_service_state_manager().load_all()
@hooks.on_infra_start(should_load=is_persistence_activated())
def register_state_save_strategy():
	from localstack.aws.handlers import run_custom_response_handlers as C,serve_custom_service_request_handlers as D;from.api import SaveStrategy as A;from.manager import SaveOnRequestHandler as H,SaveStateScheduler as I;E=get_save_strategy();F=get_service_state_manager()
	match E:
		case A.ON_SHUTDOWN:LOG.info('registering ON_SHUTDOWN save strategy');shutdown.SHUTDOWN_HANDLERS.register(F.save_all)
		case A.ON_REQUEST:LOG.info('registering ON_REQUEST save strategy');G=H(get_service_state_manager());D.append(G.on_request);C.append(G.on_response)
		case A.SCHEDULED:LOG.info('registering SCHEDULED save strategy');B=I(F,period=SNAPSHOT_FLUSH_INTERVAL);shutdown.SHUTDOWN_HANDLERS.register(B.close);D.append(B.on_request);C.append(B.on_response);B.start()
		case A.MANUAL:LOG.info('registering MANUAL save strategy (call /_localstack/state endpoints to save state)')
		case _:LOG.warning('Unknown save strategy %s',E)