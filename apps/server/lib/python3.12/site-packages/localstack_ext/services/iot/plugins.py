from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='mqtt')
def mosquitto_package():from localstack_ext.services.iot.packages import mosquitto_package as A;return A
@pro_package(name='iot-rule-engine')
def iot_rule_engine_package():from localstack_ext.services.iot.packages import iot_rule_engine_package as A;return A