from __future__ import annotations
from localstack.runtime import hooks
from localstack_ext import config
EXTENSION_HOOK_PRIORITY=-1
@hooks.on_infra_start(priority=EXTENSION_HOOK_PRIORITY,should_load=config.ACTIVATE_PRO)
def extensions_on_infra_start():from localstack.services.internal import get_internal_apis as A;from localstack_ext.extensions.platform import run_on_infra_start_hook as B;from localstack_ext.extensions.resource import ExtensionsApi as C;A().add(C());B()
@hooks.on_infra_ready(priority=EXTENSION_HOOK_PRIORITY,should_load=config.ACTIVATE_PRO)
def extensions_on_infra_ready():from localstack_ext.extensions.platform import run_on_infra_ready_hook as A;A()
@hooks.on_infra_shutdown(priority=EXTENSION_HOOK_PRIORITY,should_load=lambda:config.ACTIVATE_PRO)
def extensions_on_infra_shutdown():from localstack_ext.extensions.platform import run_on_infra_shutdown_hook as A;A()
@hooks.configure_localstack_container(should_load=config.ACTIVATE_PRO and config.EXTENSION_DEV_MODE)
def configure_extensions_dev_container(container):from localstack_ext.extensions.bootstrap import run_on_configure_localstack_container_hook as A;A(container)
@hooks.prepare_host(should_load=config.ACTIVATE_PRO and config.EXTENSION_DEV_MODE)
def configure_extensions_dev_host():from localstack_ext.extensions.bootstrap import run_on_configure_host_hook as A;A()