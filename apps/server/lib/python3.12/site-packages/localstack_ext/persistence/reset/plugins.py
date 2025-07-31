from localstack.runtime import hooks
from localstack_ext.config import ACTIVATE_PRO
@hooks.on_infra_start(should_load=ACTIVATE_PRO)
def register_reset_state_resource():from localstack.services.internal import get_internal_apis as A;from localstack.services.plugins import SERVICE_PLUGINS as B;from.endpoints import StateResetResource as C;A().add(C(B))