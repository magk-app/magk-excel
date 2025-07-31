from localstack.runtime import hooks
from localstack_ext import config
@hooks.on_infra_start(should_load=config.ACTIVATE_PRO)
def init_stackinfo_handler():from localstack.aws.handlers import run_custom_response_handlers as B;from localstack.services.internal import get_internal_apis as C;from.handler import StackInfoDataCollector as D;from.resource import StackInfoResource as E;A=D();B.append(A);C().add(E(A))