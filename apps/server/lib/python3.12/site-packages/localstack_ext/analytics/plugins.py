from localstack.runtime import hooks
from localstack_ext import config
@hooks.on_infra_start(should_load=config.ACTIVATE_PRO)
def add_aws_request_logger():from localstack.aws import handlers as A;from.aws_request_logger import RequestLoggerHandler as B;A.count_service_request=B()