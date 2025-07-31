from localstack.runtime import hooks
from localstack_ext import config as config_ext
@hooks.on_infra_start(should_load=config_ext.ACTIVATE_PRO)
def add_iam_enforcement_listener():from localstack.aws.handlers import serve_custom_service_request_handlers as A;from localstack_ext.services.iam.policy_engine.handler import IamEnforcementHandler as B;A.handlers.append(B.get())
@hooks.on_infra_start(should_load=config_ext.ACTIVATE_PRO)
def add_policy_generation_routes():from localstack.services.edge import ROUTER as A;from localstack_ext.services.iam.router import IAMRouter as B;B(A).register_routes()
@hooks.on_infra_shutdown(should_load=lambda:config_ext.ACTIVATE_PRO)
def shutdown_generator():from localstack_ext.services.iam.policy_generation.policy_generator import PolicyGenerator as A;A.get().shutdown()