from localstack.runtime import hooks
from localstack.services.internal import get_internal_apis
@hooks.on_infra_start()
def register_launchpad_api():from localstack_ext.bootstrap.pods.launchpad.api import LaunchPadApi as A;get_internal_apis().add(A())