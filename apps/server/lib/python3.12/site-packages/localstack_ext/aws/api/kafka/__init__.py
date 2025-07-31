from datetime import datetime
from typing import Dict, List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

MaxResults = int
_boolean = bool
_double = float
_integer = int
_integerMin1Max15 = int
_integerMin1Max16384 = int
_string = str
_stringMax1024 = str
_stringMax249 = str
_stringMax256 = str
_stringMin1Max128 = str
_stringMin1Max64 = str
_stringMin5Max32 = str
_stringMin1Max128Pattern09AZaZ09AZaZ0 = str


class BrokerAZDistribution(str):
    DEFAULT = "DEFAULT"


class ClientBroker(str):
    TLS = "TLS"
    TLS_PLAINTEXT = "TLS_PLAINTEXT"
    PLAINTEXT = "PLAINTEXT"


class ClusterState(str):
    ACTIVE = "ACTIVE"
    CREATING = "CREATING"
    DELETING = "DELETING"
    FAILED = "FAILED"
    HEALING = "HEALING"
    MAINTENANCE = "MAINTENANCE"
    REBOOTING_BROKER = "REBOOTING_BROKER"
    UPDATING = "UPDATING"


class ClusterType(str):
    PROVISIONED = "PROVISIONED"
    SERVERLESS = "SERVERLESS"


class ConfigurationState(str):
    ACTIVE = "ACTIVE"
    DELETING = "DELETING"
    DELETE_FAILED = "DELETE_FAILED"


class EnhancedMonitoring(str):
    DEFAULT = "DEFAULT"
    PER_BROKER = "PER_BROKER"
    PER_TOPIC_PER_BROKER = "PER_TOPIC_PER_BROKER"
    PER_TOPIC_PER_PARTITION = "PER_TOPIC_PER_PARTITION"


class KafkaVersionStatus(str):
    ACTIVE = "ACTIVE"
    DEPRECATED = "DEPRECATED"


class NodeType(str):
    BROKER = "BROKER"


class ReplicatorState(str):
    RUNNING = "RUNNING"
    CREATING = "CREATING"
    UPDATING = "UPDATING"
    DELETING = "DELETING"
    FAILED = "FAILED"


class StorageMode(str):
    LOCAL = "LOCAL"
    TIERED = "TIERED"


class TargetCompressionType(str):
    NONE = "NONE"
    GZIP = "GZIP"
    SNAPPY = "SNAPPY"
    LZ4 = "LZ4"
    ZSTD = "ZSTD"


class UserIdentityType(str):
    AWSACCOUNT = "AWSACCOUNT"
    AWSSERVICE = "AWSSERVICE"


class VpcConnectionState(str):
    CREATING = "CREATING"
    AVAILABLE = "AVAILABLE"
    INACTIVE = "INACTIVE"
    DEACTIVATING = "DEACTIVATING"
    DELETING = "DELETING"
    FAILED = "FAILED"
    REJECTED = "REJECTED"
    REJECTING = "REJECTING"


class BadRequestException(ServiceException):
    """Returns information about an error."""

    code: str = "BadRequestException"
    sender_fault: bool = False
    status_code: int = 400
    InvalidParameter: Optional[_string]


class ConflictException(ServiceException):
    """Returns information about an error."""

    code: str = "ConflictException"
    sender_fault: bool = False
    status_code: int = 409
    InvalidParameter: Optional[_string]


class ForbiddenException(ServiceException):
    """Returns information about an error."""

    code: str = "ForbiddenException"
    sender_fault: bool = False
    status_code: int = 403
    InvalidParameter: Optional[_string]


class InternalServerErrorException(ServiceException):
    """Returns information about an error."""

    code: str = "InternalServerErrorException"
    sender_fault: bool = False
    status_code: int = 500
    InvalidParameter: Optional[_string]


class NotFoundException(ServiceException):
    """Returns information about an error."""

    code: str = "NotFoundException"
    sender_fault: bool = False
    status_code: int = 404
    InvalidParameter: Optional[_string]


class ServiceUnavailableException(ServiceException):
    """Returns information about an error."""

    code: str = "ServiceUnavailableException"
    sender_fault: bool = False
    status_code: int = 503
    InvalidParameter: Optional[_string]


class TooManyRequestsException(ServiceException):
    """Returns information about an error."""

    code: str = "TooManyRequestsException"
    sender_fault: bool = False
    status_code: int = 429
    InvalidParameter: Optional[_string]


class UnauthorizedException(ServiceException):
    """Returns information about an error."""

    code: str = "UnauthorizedException"
    sender_fault: bool = False
    status_code: int = 401
    InvalidParameter: Optional[_string]


class AmazonMskCluster(TypedDict, total=False):
    """Details of an Amazon MSK Cluster."""

    MskClusterArn: _string


_listOf__string = List[_string]


class BatchAssociateScramSecretRequest(ServiceRequest):
    """Associates sasl scram secrets to cluster."""

    ClusterArn: _string
    SecretArnList: _listOf__string


class UnprocessedScramSecret(TypedDict, total=False):
    """Error info for scram secret associate/disassociate failure."""

    ErrorCode: Optional[_string]
    ErrorMessage: Optional[_string]
    SecretArn: Optional[_string]


_listOfUnprocessedScramSecret = List[UnprocessedScramSecret]


class BatchAssociateScramSecretResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    UnprocessedScramSecrets: Optional[_listOfUnprocessedScramSecret]


class ProvisionedThroughput(TypedDict, total=False):
    """Contains information about provisioned throughput for EBS storage
    volumes attached to kafka broker nodes.
    """

    Enabled: Optional[_boolean]
    VolumeThroughput: Optional[_integer]


class BrokerEBSVolumeInfo(TypedDict, total=False):
    """Specifies the EBS volume upgrade information. The broker identifier must
    be set to the keyword ALL. This means the changes apply to all the
    brokers in the cluster.
    """

    KafkaBrokerNodeId: _string
    ProvisionedThroughput: Optional[ProvisionedThroughput]
    VolumeSizeGB: Optional[_integer]


class S3(TypedDict, total=False):
    Bucket: Optional[_string]
    Enabled: _boolean
    Prefix: Optional[_string]


class Firehose(TypedDict, total=False):
    DeliveryStream: Optional[_string]
    Enabled: _boolean


class CloudWatchLogs(TypedDict, total=False):
    Enabled: _boolean
    LogGroup: Optional[_string]


class BrokerLogs(TypedDict, total=False):
    CloudWatchLogs: Optional[CloudWatchLogs]
    Firehose: Optional[Firehose]
    S3: Optional[S3]


class VpcConnectivityTls(TypedDict, total=False):
    """Details for TLS client authentication for VPC connectivity."""

    Enabled: Optional[_boolean]


class VpcConnectivityIam(TypedDict, total=False):
    """Details for IAM access control for VPC connectivity."""

    Enabled: Optional[_boolean]


class VpcConnectivityScram(TypedDict, total=False):
    """Details for SASL/SCRAM client authentication for VPC connectivity."""

    Enabled: Optional[_boolean]


class VpcConnectivitySasl(TypedDict, total=False):
    """Details for SASL client authentication for VPC connectivity."""

    Scram: Optional[VpcConnectivityScram]
    Iam: Optional[VpcConnectivityIam]


class VpcConnectivityClientAuthentication(TypedDict, total=False):
    """Includes all client authentication information for VPC connectivity."""

    Sasl: Optional[VpcConnectivitySasl]
    Tls: Optional[VpcConnectivityTls]


class VpcConnectivity(TypedDict, total=False):
    """VPC connectivity access control for brokers."""

    ClientAuthentication: Optional[VpcConnectivityClientAuthentication]


class PublicAccess(TypedDict, total=False):
    """Public access control for brokers."""

    Type: Optional[_string]


class ConnectivityInfo(TypedDict, total=False):
    """Information about the broker access configuration."""

    PublicAccess: Optional[PublicAccess]
    VpcConnectivity: Optional[VpcConnectivity]


class EBSStorageInfo(TypedDict, total=False):
    """Contains information about the EBS storage volumes attached to Apache
    Kafka broker nodes.
    """

    ProvisionedThroughput: Optional[ProvisionedThroughput]
    VolumeSize: Optional[_integerMin1Max16384]


class StorageInfo(TypedDict, total=False):
    """Contains information about storage volumes attached to MSK broker nodes."""

    EbsStorageInfo: Optional[EBSStorageInfo]


class BrokerNodeGroupInfo(TypedDict, total=False):
    """Describes the setup to be used for Apache Kafka broker nodes in the
    cluster.
    """

    BrokerAZDistribution: Optional[BrokerAZDistribution]
    ClientSubnets: _listOf__string
    InstanceType: _stringMin5Max32
    SecurityGroups: Optional[_listOf__string]
    StorageInfo: Optional[StorageInfo]
    ConnectivityInfo: Optional[ConnectivityInfo]
    ZoneIds: Optional[_listOf__string]


_long = int


class BrokerSoftwareInfo(TypedDict, total=False):
    """Information about the current software installed on the cluster."""

    ConfigurationArn: Optional[_string]
    ConfigurationRevision: Optional[_long]
    KafkaVersion: Optional[_string]


class BrokerNodeInfo(TypedDict, total=False):
    """BrokerNodeInfo"""

    AttachedENIId: Optional[_string]
    BrokerId: Optional[_double]
    ClientSubnet: Optional[_string]
    ClientVpcIpAddress: Optional[_string]
    CurrentBrokerSoftwareInfo: Optional[BrokerSoftwareInfo]
    Endpoints: Optional[_listOf__string]


class Unauthenticated(TypedDict, total=False):
    Enabled: Optional[_boolean]


class Tls(TypedDict, total=False):
    """Details for client authentication using TLS."""

    CertificateAuthorityArnList: Optional[_listOf__string]
    Enabled: Optional[_boolean]


class Iam(TypedDict, total=False):
    """Details for IAM access control."""

    Enabled: Optional[_boolean]


class Scram(TypedDict, total=False):
    """Details for SASL/SCRAM client authentication."""

    Enabled: Optional[_boolean]


class Sasl(TypedDict, total=False):
    """Details for client authentication using SASL."""

    Scram: Optional[Scram]
    Iam: Optional[Iam]


class ClientAuthentication(TypedDict, total=False):
    """Includes all client authentication information."""

    Sasl: Optional[Sasl]
    Tls: Optional[Tls]
    Unauthenticated: Optional[Unauthenticated]


class ServerlessSasl(TypedDict, total=False):
    """Details for client authentication using SASL."""

    Iam: Optional[Iam]


class ServerlessClientAuthentication(TypedDict, total=False):
    """Includes all client authentication information."""

    Sasl: Optional[ServerlessSasl]


_mapOf__string = Dict[_string, _string]


class StateInfo(TypedDict, total=False):
    Code: Optional[_string]
    Message: Optional[_string]


class LoggingInfo(TypedDict, total=False):
    BrokerLogs: BrokerLogs


class NodeExporter(TypedDict, total=False):
    """Indicates whether you want to turn on or turn off the Node Exporter."""

    EnabledInBroker: _boolean


class JmxExporter(TypedDict, total=False):
    """Indicates whether you want to turn on or turn off the JMX Exporter."""

    EnabledInBroker: _boolean


class Prometheus(TypedDict, total=False):
    """Prometheus settings."""

    JmxExporter: Optional[JmxExporter]
    NodeExporter: Optional[NodeExporter]


class OpenMonitoring(TypedDict, total=False):
    """JMX and Node monitoring for the MSK cluster."""

    Prometheus: Prometheus


class EncryptionInTransit(TypedDict, total=False):
    """The settings for encrypting data in transit."""

    ClientBroker: Optional[ClientBroker]
    InCluster: Optional[_boolean]


class EncryptionAtRest(TypedDict, total=False):
    """The data-volume encryption details."""

    DataVolumeKMSKeyId: _string


class EncryptionInfo(TypedDict, total=False):
    """Includes encryption-related information, such as the AWS KMS key used
    for encrypting data at rest and whether you want MSK to encrypt your
    data in transit.
    """

    EncryptionAtRest: Optional[EncryptionAtRest]
    EncryptionInTransit: Optional[EncryptionInTransit]


_timestampIso8601 = datetime


class ClusterInfo(TypedDict, total=False):
    """Returns information about a cluster."""

    ActiveOperationArn: Optional[_string]
    BrokerNodeGroupInfo: Optional[BrokerNodeGroupInfo]
    ClientAuthentication: Optional[ClientAuthentication]
    ClusterArn: Optional[_string]
    ClusterName: Optional[_string]
    CreationTime: Optional[_timestampIso8601]
    CurrentBrokerSoftwareInfo: Optional[BrokerSoftwareInfo]
    CurrentVersion: Optional[_string]
    EncryptionInfo: Optional[EncryptionInfo]
    EnhancedMonitoring: Optional[EnhancedMonitoring]
    OpenMonitoring: Optional[OpenMonitoring]
    LoggingInfo: Optional[LoggingInfo]
    NumberOfBrokerNodes: Optional[_integer]
    State: Optional[ClusterState]
    StateInfo: Optional[StateInfo]
    Tags: Optional[_mapOf__string]
    ZookeeperConnectString: Optional[_string]
    ZookeeperConnectStringTls: Optional[_string]
    StorageMode: Optional[StorageMode]


class VpcConfig(TypedDict, total=False):
    """The configuration of the Amazon VPCs for the cluster."""

    SubnetIds: _listOf__string
    SecurityGroupIds: Optional[_listOf__string]


_listOfVpcConfig = List[VpcConfig]


class Serverless(TypedDict, total=False):
    """Serverless cluster."""

    VpcConfigs: _listOfVpcConfig
    ClientAuthentication: Optional[ServerlessClientAuthentication]


class NodeExporterInfo(TypedDict, total=False):
    """Indicates whether you want to turn on or turn off the Node Exporter."""

    EnabledInBroker: _boolean


class JmxExporterInfo(TypedDict, total=False):
    """Indicates whether you want to turn on or turn off the JMX Exporter."""

    EnabledInBroker: _boolean


class PrometheusInfo(TypedDict, total=False):
    """Prometheus settings."""

    JmxExporter: Optional[JmxExporterInfo]
    NodeExporter: Optional[NodeExporterInfo]


class OpenMonitoringInfo(TypedDict, total=False):
    """JMX and Node monitoring for the MSK cluster."""

    Prometheus: PrometheusInfo


class Provisioned(TypedDict, total=False):
    """Provisioned cluster."""

    BrokerNodeGroupInfo: BrokerNodeGroupInfo
    CurrentBrokerSoftwareInfo: Optional[BrokerSoftwareInfo]
    ClientAuthentication: Optional[ClientAuthentication]
    EncryptionInfo: Optional[EncryptionInfo]
    EnhancedMonitoring: Optional[EnhancedMonitoring]
    OpenMonitoring: Optional[OpenMonitoringInfo]
    LoggingInfo: Optional[LoggingInfo]
    NumberOfBrokerNodes: _integerMin1Max15
    ZookeeperConnectString: Optional[_string]
    ZookeeperConnectStringTls: Optional[_string]
    StorageMode: Optional[StorageMode]


class Cluster(TypedDict, total=False):
    """Returns information about a cluster."""

    ActiveOperationArn: Optional[_string]
    ClusterType: Optional[ClusterType]
    ClusterArn: Optional[_string]
    ClusterName: Optional[_string]
    CreationTime: Optional[_timestampIso8601]
    CurrentVersion: Optional[_string]
    State: Optional[ClusterState]
    StateInfo: Optional[StateInfo]
    Tags: Optional[_mapOf__string]
    Provisioned: Optional[Provisioned]
    Serverless: Optional[Serverless]


class UserIdentity(TypedDict, total=False):
    """Description of the requester that calls the API operation."""

    Type: Optional[UserIdentityType]
    PrincipalId: Optional[_string]


class VpcConnectionInfo(TypedDict, total=False):
    """Description of the VPC connection."""

    VpcConnectionArn: Optional[_string]
    Owner: Optional[_string]
    UserIdentity: Optional[UserIdentity]
    CreationTime: Optional[_timestampIso8601]


class ConfigurationInfo(TypedDict, total=False):
    """Specifies the configuration to use for the brokers."""

    Arn: _string
    Revision: _long


_listOfBrokerEBSVolumeInfo = List[BrokerEBSVolumeInfo]


class MutableClusterInfo(TypedDict, total=False):
    """Information about cluster attributes that can be updated via update
    APIs.
    """

    BrokerEBSVolumeInfo: Optional[_listOfBrokerEBSVolumeInfo]
    ConfigurationInfo: Optional[ConfigurationInfo]
    NumberOfBrokerNodes: Optional[_integer]
    EnhancedMonitoring: Optional[EnhancedMonitoring]
    OpenMonitoring: Optional[OpenMonitoring]
    KafkaVersion: Optional[_string]
    LoggingInfo: Optional[LoggingInfo]
    InstanceType: Optional[_stringMin5Max32]
    ClientAuthentication: Optional[ClientAuthentication]
    EncryptionInfo: Optional[EncryptionInfo]
    ConnectivityInfo: Optional[ConnectivityInfo]
    StorageMode: Optional[StorageMode]


class ClusterOperationStepInfo(TypedDict, total=False):
    """State information about the operation step."""

    StepStatus: Optional[_string]


class ClusterOperationStep(TypedDict, total=False):
    """Step taken during a cluster operation."""

    StepInfo: Optional[ClusterOperationStepInfo]
    StepName: Optional[_string]


_listOfClusterOperationStep = List[ClusterOperationStep]


class ErrorInfo(TypedDict, total=False):
    """Returns information about an error state of the cluster."""

    ErrorCode: Optional[_string]
    ErrorString: Optional[_string]


class ClusterOperationInfo(TypedDict, total=False):
    """Returns information about a cluster operation."""

    ClientRequestId: Optional[_string]
    ClusterArn: Optional[_string]
    CreationTime: Optional[_timestampIso8601]
    EndTime: Optional[_timestampIso8601]
    ErrorInfo: Optional[ErrorInfo]
    OperationArn: Optional[_string]
    OperationState: Optional[_string]
    OperationSteps: Optional[_listOfClusterOperationStep]
    OperationType: Optional[_string]
    SourceClusterInfo: Optional[MutableClusterInfo]
    TargetClusterInfo: Optional[MutableClusterInfo]
    VpcConnectionInfo: Optional[VpcConnectionInfo]


class ProvisionedRequest(TypedDict, total=False):
    """Provisioned cluster request."""

    BrokerNodeGroupInfo: BrokerNodeGroupInfo
    ClientAuthentication: Optional[ClientAuthentication]
    ConfigurationInfo: Optional[ConfigurationInfo]
    EncryptionInfo: Optional[EncryptionInfo]
    EnhancedMonitoring: Optional[EnhancedMonitoring]
    OpenMonitoring: Optional[OpenMonitoringInfo]
    KafkaVersion: _stringMin1Max128
    LoggingInfo: Optional[LoggingInfo]
    NumberOfBrokerNodes: _integerMin1Max15
    StorageMode: Optional[StorageMode]


class ServerlessRequest(TypedDict, total=False):
    """Serverless cluster request."""

    VpcConfigs: _listOfVpcConfig
    ClientAuthentication: Optional[ServerlessClientAuthentication]


class ClientVpcConnection(TypedDict, total=False):
    """The client VPC connection object."""

    Authentication: Optional[_string]
    CreationTime: Optional[_timestampIso8601]
    State: Optional[VpcConnectionState]
    VpcConnectionArn: _string
    Owner: Optional[_string]


class VpcConnection(TypedDict, total=False):
    """The VPC connection object."""

    VpcConnectionArn: _string
    TargetClusterArn: _string
    CreationTime: Optional[_timestampIso8601]
    Authentication: Optional[_string]
    VpcId: Optional[_string]
    State: Optional[VpcConnectionState]


class CompatibleKafkaVersion(TypedDict, total=False):
    """Contains source Apache Kafka versions and compatible target Apache Kafka
    versions.
    """

    SourceVersion: Optional[_string]
    TargetVersions: Optional[_listOf__string]


class ConfigurationRevision(TypedDict, total=False):
    """Describes a configuration revision."""

    CreationTime: _timestampIso8601
    Description: Optional[_string]
    Revision: _long


class Configuration(TypedDict, total=False):
    """Represents an MSK Configuration."""

    Arn: _string
    CreationTime: _timestampIso8601
    Description: _string
    KafkaVersions: _listOf__string
    LatestRevision: ConfigurationRevision
    Name: _string
    State: ConfigurationState


_listOf__stringMax256 = List[_stringMax256]


class ConsumerGroupReplication(TypedDict, total=False):
    """Details about consumer group replication."""

    ConsumerGroupsToExclude: Optional[_listOf__stringMax256]
    ConsumerGroupsToReplicate: _listOf__stringMax256
    DetectAndCopyNewConsumerGroups: Optional[_boolean]
    SynchroniseConsumerGroupOffsets: Optional[_boolean]


class ConsumerGroupReplicationUpdate(TypedDict, total=False):
    """Details about consumer group replication."""

    ConsumerGroupsToExclude: _listOf__stringMax256
    ConsumerGroupsToReplicate: _listOf__stringMax256
    DetectAndCopyNewConsumerGroups: _boolean
    SynchroniseConsumerGroupOffsets: _boolean


class CreateClusterV2Request(ServiceRequest):
    ClusterName: _stringMin1Max64
    Tags: Optional[_mapOf__string]
    Provisioned: Optional[ProvisionedRequest]
    Serverless: Optional[ServerlessRequest]


class CreateClusterRequest(ServiceRequest):
    BrokerNodeGroupInfo: BrokerNodeGroupInfo
    ClientAuthentication: Optional[ClientAuthentication]
    ClusterName: _stringMin1Max64
    ConfigurationInfo: Optional[ConfigurationInfo]
    EncryptionInfo: Optional[EncryptionInfo]
    EnhancedMonitoring: Optional[EnhancedMonitoring]
    OpenMonitoring: Optional[OpenMonitoringInfo]
    KafkaVersion: _stringMin1Max128
    LoggingInfo: Optional[LoggingInfo]
    NumberOfBrokerNodes: _integerMin1Max15
    Tags: Optional[_mapOf__string]
    StorageMode: Optional[StorageMode]


class CreateClusterResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterName: Optional[_string]
    State: Optional[ClusterState]


class CreateClusterV2Response(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterName: Optional[_string]
    State: Optional[ClusterState]
    ClusterType: Optional[ClusterType]


_blob = bytes


class CreateConfigurationRequest(ServiceRequest):
    Description: Optional[_string]
    KafkaVersions: Optional[_listOf__string]
    Name: _string
    ServerProperties: _blob


class CreateConfigurationResponse(TypedDict, total=False):
    Arn: Optional[_string]
    CreationTime: Optional[_timestampIso8601]
    LatestRevision: Optional[ConfigurationRevision]
    Name: Optional[_string]
    State: Optional[ConfigurationState]


_listOf__stringMax249 = List[_stringMax249]


class TopicReplication(TypedDict, total=False):
    """Details about topic replication."""

    CopyAccessControlListsForTopics: Optional[_boolean]
    CopyTopicConfigurations: Optional[_boolean]
    DetectAndCopyNewTopics: Optional[_boolean]
    TopicsToExclude: Optional[_listOf__stringMax249]
    TopicsToReplicate: _listOf__stringMax249


class ReplicationInfo(TypedDict, total=False):
    """Specifies configuration for replication between a source and target
    Kafka cluster.
    """

    ConsumerGroupReplication: ConsumerGroupReplication
    SourceKafkaClusterArn: _string
    TargetCompressionType: TargetCompressionType
    TargetKafkaClusterArn: _string
    TopicReplication: TopicReplication


_listOfReplicationInfo = List[ReplicationInfo]


class KafkaClusterClientVpcConfig(TypedDict, total=False):
    """Details of an Amazon VPC which has network connectivity to the Apache
    Kafka cluster.
    """

    SecurityGroupIds: Optional[_listOf__string]
    SubnetIds: _listOf__string


class KafkaCluster(TypedDict, total=False):
    """Information about Kafka Cluster to be used as source / target for
    replication.
    """

    AmazonMskCluster: AmazonMskCluster
    VpcConfig: KafkaClusterClientVpcConfig


_listOfKafkaCluster = List[KafkaCluster]


class CreateReplicatorRequest(ServiceRequest):
    """Creates a replicator using the specified configuration."""

    Description: Optional[_stringMax1024]
    KafkaClusters: _listOfKafkaCluster
    ReplicationInfoList: _listOfReplicationInfo
    ReplicatorName: _stringMin1Max128Pattern09AZaZ09AZaZ0
    ServiceExecutionRoleArn: _string
    Tags: Optional[_mapOf__string]


class CreateReplicatorResponse(TypedDict, total=False):
    ReplicatorArn: Optional[_string]
    ReplicatorName: Optional[_string]
    ReplicatorState: Optional[ReplicatorState]


class CreateVpcConnectionRequest(ServiceRequest):
    TargetClusterArn: _string
    Authentication: _string
    VpcId: _string
    ClientSubnets: _listOf__string
    SecurityGroups: _listOf__string
    Tags: Optional[_mapOf__string]


class CreateVpcConnectionResponse(TypedDict, total=False):
    VpcConnectionArn: Optional[_string]
    State: Optional[VpcConnectionState]
    Authentication: Optional[_string]
    VpcId: Optional[_string]
    ClientSubnets: Optional[_listOf__string]
    SecurityGroups: Optional[_listOf__string]
    CreationTime: Optional[_timestampIso8601]
    Tags: Optional[_mapOf__string]


class VpcConnectionInfoServerless(TypedDict, total=False):
    """Description of the VPC connection."""

    CreationTime: Optional[_timestampIso8601]
    Owner: Optional[_string]
    UserIdentity: Optional[UserIdentity]
    VpcConnectionArn: Optional[_string]


class ClusterOperationV2Serverless(TypedDict, total=False):
    """Returns information about a serverless cluster operation."""

    VpcConnectionInfo: Optional[VpcConnectionInfoServerless]


class ClusterOperationV2Provisioned(TypedDict, total=False):
    """Returns information about a provisioned cluster operation."""

    OperationSteps: Optional[_listOfClusterOperationStep]
    SourceClusterInfo: Optional[MutableClusterInfo]
    TargetClusterInfo: Optional[MutableClusterInfo]
    VpcConnectionInfo: Optional[VpcConnectionInfo]


class ClusterOperationV2(TypedDict, total=False):
    """Returns information about a cluster operation."""

    ClusterArn: Optional[_string]
    ClusterType: Optional[ClusterType]
    StartTime: Optional[_timestampIso8601]
    EndTime: Optional[_timestampIso8601]
    ErrorInfo: Optional[ErrorInfo]
    OperationArn: Optional[_string]
    OperationState: Optional[_string]
    OperationType: Optional[_string]
    Provisioned: Optional[ClusterOperationV2Provisioned]
    Serverless: Optional[ClusterOperationV2Serverless]


class ClusterOperationV2Summary(TypedDict, total=False):
    """Returns information about a cluster operation."""

    ClusterArn: Optional[_string]
    ClusterType: Optional[ClusterType]
    StartTime: Optional[_timestampIso8601]
    EndTime: Optional[_timestampIso8601]
    OperationArn: Optional[_string]
    OperationState: Optional[_string]
    OperationType: Optional[_string]


class DeleteClusterRequest(ServiceRequest):
    ClusterArn: _string
    CurrentVersion: Optional[_string]


class DeleteClusterResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    State: Optional[ClusterState]


class DeleteClusterPolicyRequest(ServiceRequest):
    ClusterArn: _string


class DeleteClusterPolicyResponse(TypedDict, total=False):
    pass


class DeleteConfigurationRequest(ServiceRequest):
    Arn: _string


class DeleteConfigurationResponse(TypedDict, total=False):
    Arn: Optional[_string]
    State: Optional[ConfigurationState]


class DeleteReplicatorRequest(ServiceRequest):
    CurrentVersion: Optional[_string]
    ReplicatorArn: _string


class DeleteReplicatorResponse(TypedDict, total=False):
    ReplicatorArn: Optional[_string]
    ReplicatorState: Optional[ReplicatorState]


class DeleteVpcConnectionRequest(ServiceRequest):
    Arn: _string


class DeleteVpcConnectionResponse(TypedDict, total=False):
    VpcConnectionArn: Optional[_string]
    State: Optional[VpcConnectionState]


class DescribeClusterOperationRequest(ServiceRequest):
    ClusterOperationArn: _string


class DescribeClusterOperationV2Request(ServiceRequest):
    ClusterOperationArn: _string


class DescribeClusterOperationResponse(TypedDict, total=False):
    ClusterOperationInfo: Optional[ClusterOperationInfo]


class DescribeClusterOperationV2Response(TypedDict, total=False):
    ClusterOperationInfo: Optional[ClusterOperationV2]


class DescribeClusterRequest(ServiceRequest):
    ClusterArn: _string


class DescribeClusterV2Request(ServiceRequest):
    ClusterArn: _string


class DescribeClusterResponse(TypedDict, total=False):
    ClusterInfo: Optional[ClusterInfo]


class DescribeClusterV2Response(TypedDict, total=False):
    ClusterInfo: Optional[Cluster]


class DescribeConfigurationRequest(ServiceRequest):
    Arn: _string


class DescribeConfigurationResponse(TypedDict, total=False):
    Arn: Optional[_string]
    CreationTime: Optional[_timestampIso8601]
    Description: Optional[_string]
    KafkaVersions: Optional[_listOf__string]
    LatestRevision: Optional[ConfigurationRevision]
    Name: Optional[_string]
    State: Optional[ConfigurationState]


class DescribeConfigurationRevisionRequest(ServiceRequest):
    Arn: _string
    Revision: _long


class DescribeConfigurationRevisionResponse(TypedDict, total=False):
    Arn: Optional[_string]
    CreationTime: Optional[_timestampIso8601]
    Description: Optional[_string]
    Revision: Optional[_long]
    ServerProperties: Optional[_blob]


class DescribeVpcConnectionRequest(ServiceRequest):
    Arn: _string


class DescribeReplicatorRequest(ServiceRequest):
    ReplicatorArn: _string


class ReplicationStateInfo(TypedDict, total=False):
    """Details about the state of a replicator"""

    Code: Optional[_string]
    Message: Optional[_string]


class ReplicationInfoDescription(TypedDict, total=False):
    """Specifies configuration for replication between a source and target
    Kafka cluster (sourceKafkaClusterAlias -> targetKafkaClusterAlias)
    """

    ConsumerGroupReplication: Optional[ConsumerGroupReplication]
    SourceKafkaClusterAlias: Optional[_string]
    TargetCompressionType: Optional[TargetCompressionType]
    TargetKafkaClusterAlias: Optional[_string]
    TopicReplication: Optional[TopicReplication]


_listOfReplicationInfoDescription = List[ReplicationInfoDescription]


class KafkaClusterDescription(TypedDict, total=False):
    """Information about Kafka Cluster used as source / target for replication."""

    AmazonMskCluster: Optional[AmazonMskCluster]
    KafkaClusterAlias: Optional[_string]
    VpcConfig: Optional[KafkaClusterClientVpcConfig]


_listOfKafkaClusterDescription = List[KafkaClusterDescription]


class DescribeReplicatorResponse(TypedDict, total=False):
    CreationTime: Optional[_timestampIso8601]
    CurrentVersion: Optional[_string]
    IsReplicatorReference: Optional[_boolean]
    KafkaClusters: Optional[_listOfKafkaClusterDescription]
    ReplicationInfoList: Optional[_listOfReplicationInfoDescription]
    ReplicatorArn: Optional[_string]
    ReplicatorDescription: Optional[_string]
    ReplicatorName: Optional[_string]
    ReplicatorResourceArn: Optional[_string]
    ReplicatorState: Optional[ReplicatorState]
    ServiceExecutionRoleArn: Optional[_string]
    StateInfo: Optional[ReplicationStateInfo]
    Tags: Optional[_mapOf__string]


class DescribeVpcConnectionResponse(TypedDict, total=False):
    VpcConnectionArn: Optional[_string]
    TargetClusterArn: Optional[_string]
    State: Optional[VpcConnectionState]
    Authentication: Optional[_string]
    VpcId: Optional[_string]
    Subnets: Optional[_listOf__string]
    SecurityGroups: Optional[_listOf__string]
    CreationTime: Optional[_timestampIso8601]
    Tags: Optional[_mapOf__string]


class BatchDisassociateScramSecretRequest(ServiceRequest):
    """Disassociates sasl scram secrets to cluster."""

    ClusterArn: _string
    SecretArnList: _listOf__string


class BatchDisassociateScramSecretResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    UnprocessedScramSecrets: Optional[_listOfUnprocessedScramSecret]


class Error(TypedDict, total=False):
    """Returns information about an error."""

    InvalidParameter: Optional[_string]
    Message: Optional[_string]


class GetBootstrapBrokersRequest(ServiceRequest):
    ClusterArn: _string


class GetBootstrapBrokersResponse(TypedDict, total=False):
    BootstrapBrokerString: Optional[_string]
    BootstrapBrokerStringTls: Optional[_string]
    BootstrapBrokerStringSaslScram: Optional[_string]
    BootstrapBrokerStringSaslIam: Optional[_string]
    BootstrapBrokerStringPublicTls: Optional[_string]
    BootstrapBrokerStringPublicSaslScram: Optional[_string]
    BootstrapBrokerStringPublicSaslIam: Optional[_string]
    BootstrapBrokerStringVpcConnectivityTls: Optional[_string]
    BootstrapBrokerStringVpcConnectivitySaslScram: Optional[_string]
    BootstrapBrokerStringVpcConnectivitySaslIam: Optional[_string]


class GetCompatibleKafkaVersionsRequest(ServiceRequest):
    ClusterArn: Optional[_string]


_listOfCompatibleKafkaVersion = List[CompatibleKafkaVersion]


class GetCompatibleKafkaVersionsResponse(TypedDict, total=False):
    CompatibleKafkaVersions: Optional[_listOfCompatibleKafkaVersion]


class GetClusterPolicyRequest(ServiceRequest):
    ClusterArn: _string


class GetClusterPolicyResponse(TypedDict, total=False):
    CurrentVersion: Optional[_string]
    Policy: Optional[_string]


class KafkaClusterSummary(TypedDict, total=False):
    """Summarized information about Kafka Cluster used as source / target for
    replication.
    """

    AmazonMskCluster: Optional[AmazonMskCluster]
    KafkaClusterAlias: Optional[_string]


class KafkaVersion(TypedDict, total=False):
    Version: Optional[_string]
    Status: Optional[KafkaVersionStatus]


class ListClusterOperationsRequest(ServiceRequest):
    ClusterArn: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ListClusterOperationsV2Request(ServiceRequest):
    ClusterArn: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


_listOfClusterOperationInfo = List[ClusterOperationInfo]


class ListClusterOperationsResponse(TypedDict, total=False):
    ClusterOperationInfoList: Optional[_listOfClusterOperationInfo]
    NextToken: Optional[_string]


_listOfClusterOperationV2Summary = List[ClusterOperationV2Summary]


class ListClusterOperationsV2Response(TypedDict, total=False):
    ClusterOperationInfoList: Optional[_listOfClusterOperationV2Summary]
    NextToken: Optional[_string]


class ListClustersRequest(ServiceRequest):
    ClusterNameFilter: Optional[_string]
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ListClustersV2Request(ServiceRequest):
    ClusterNameFilter: Optional[_string]
    ClusterTypeFilter: Optional[_string]
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


_listOfClusterInfo = List[ClusterInfo]


class ListClustersResponse(TypedDict, total=False):
    ClusterInfoList: Optional[_listOfClusterInfo]
    NextToken: Optional[_string]


_listOfCluster = List[Cluster]


class ListClustersV2Response(TypedDict, total=False):
    ClusterInfoList: Optional[_listOfCluster]
    NextToken: Optional[_string]


class ListConfigurationRevisionsRequest(ServiceRequest):
    Arn: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


_listOfConfigurationRevision = List[ConfigurationRevision]


class ListConfigurationRevisionsResponse(TypedDict, total=False):
    NextToken: Optional[_string]
    Revisions: Optional[_listOfConfigurationRevision]


class ListConfigurationsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


_listOfConfiguration = List[Configuration]


class ListConfigurationsResponse(TypedDict, total=False):
    Configurations: Optional[_listOfConfiguration]
    NextToken: Optional[_string]


class ListKafkaVersionsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


_listOfKafkaVersion = List[KafkaVersion]


class ListKafkaVersionsResponse(TypedDict, total=False):
    KafkaVersions: Optional[_listOfKafkaVersion]
    NextToken: Optional[_string]


class ListNodesRequest(ServiceRequest):
    ClusterArn: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ZookeeperNodeInfo(TypedDict, total=False):
    """Zookeeper node information."""

    AttachedENIId: Optional[_string]
    ClientVpcIpAddress: Optional[_string]
    Endpoints: Optional[_listOf__string]
    ZookeeperId: Optional[_double]
    ZookeeperVersion: Optional[_string]


class NodeInfo(TypedDict, total=False):
    """The node information object."""

    AddedToClusterTime: Optional[_string]
    BrokerNodeInfo: Optional[BrokerNodeInfo]
    InstanceType: Optional[_string]
    NodeARN: Optional[_string]
    NodeType: Optional[NodeType]
    ZookeeperNodeInfo: Optional[ZookeeperNodeInfo]


_listOfNodeInfo = List[NodeInfo]


class ListNodesResponse(TypedDict, total=False):
    NextToken: Optional[_string]
    NodeInfoList: Optional[_listOfNodeInfo]


class ListReplicatorsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]
    ReplicatorNameFilter: Optional[_string]


class ReplicationInfoSummary(TypedDict, total=False):
    """Summarized information of replication between clusters."""

    SourceKafkaClusterAlias: Optional[_string]
    TargetKafkaClusterAlias: Optional[_string]


_listOfReplicationInfoSummary = List[ReplicationInfoSummary]
_listOfKafkaClusterSummary = List[KafkaClusterSummary]


class ReplicatorSummary(TypedDict, total=False):
    """Information about a replicator."""

    CreationTime: Optional[_timestampIso8601]
    CurrentVersion: Optional[_string]
    IsReplicatorReference: Optional[_boolean]
    KafkaClustersSummary: Optional[_listOfKafkaClusterSummary]
    ReplicationInfoSummaryList: Optional[_listOfReplicationInfoSummary]
    ReplicatorArn: Optional[_string]
    ReplicatorName: Optional[_string]
    ReplicatorResourceArn: Optional[_string]
    ReplicatorState: Optional[ReplicatorState]


_listOfReplicatorSummary = List[ReplicatorSummary]


class ListReplicatorsResponse(TypedDict, total=False):
    NextToken: Optional[_string]
    Replicators: Optional[_listOfReplicatorSummary]


class ListScramSecretsRequest(ServiceRequest):
    ClusterArn: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ListScramSecretsResponse(TypedDict, total=False):
    NextToken: Optional[_string]
    SecretArnList: Optional[_listOf__string]


class ListTagsForResourceRequest(ServiceRequest):
    ResourceArn: _string


class ListTagsForResourceResponse(TypedDict, total=False):
    Tags: Optional[_mapOf__string]


class ListClientVpcConnectionsRequest(ServiceRequest):
    ClusterArn: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


_listOfClientVpcConnection = List[ClientVpcConnection]


class ListClientVpcConnectionsResponse(TypedDict, total=False):
    ClientVpcConnections: Optional[_listOfClientVpcConnection]
    NextToken: Optional[_string]


class ListVpcConnectionsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


_listOfVpcConnection = List[VpcConnection]


class ListVpcConnectionsResponse(TypedDict, total=False):
    VpcConnections: Optional[_listOfVpcConnection]
    NextToken: Optional[_string]


class RejectClientVpcConnectionRequest(ServiceRequest):
    ClusterArn: _string
    VpcConnectionArn: _string


class RejectClientVpcConnectionResponse(TypedDict, total=False):
    pass


class PutClusterPolicyRequest(ServiceRequest):
    ClusterArn: _string
    CurrentVersion: Optional[_string]
    Policy: _string


class PutClusterPolicyResponse(TypedDict, total=False):
    CurrentVersion: Optional[_string]


class RebootBrokerRequest(ServiceRequest):
    """Reboots a node."""

    BrokerIds: _listOf__string
    ClusterArn: _string


class RebootBrokerResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class TagResourceRequest(ServiceRequest):
    ResourceArn: _string
    Tags: _mapOf__string


class TopicReplicationUpdate(TypedDict, total=False):
    """Details for updating the topic replication of a replicator."""

    CopyAccessControlListsForTopics: _boolean
    CopyTopicConfigurations: _boolean
    DetectAndCopyNewTopics: _boolean
    TopicsToExclude: _listOf__stringMax249
    TopicsToReplicate: _listOf__stringMax249


class UntagResourceRequest(ServiceRequest):
    ResourceArn: _string
    TagKeys: _listOf__string


class UpdateBrokerCountRequest(ServiceRequest):
    ClusterArn: _string
    CurrentVersion: _string
    TargetNumberOfBrokerNodes: _integerMin1Max15


class UpdateBrokerCountResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateBrokerTypeRequest(ServiceRequest):
    ClusterArn: _string
    CurrentVersion: _string
    TargetInstanceType: _string


class UpdateBrokerTypeResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateBrokerStorageRequest(ServiceRequest):
    ClusterArn: _string
    CurrentVersion: _string
    TargetBrokerEBSVolumeInfo: _listOfBrokerEBSVolumeInfo


class UpdateBrokerStorageResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateClusterConfigurationRequest(ServiceRequest):
    ClusterArn: _string
    ConfigurationInfo: ConfigurationInfo
    CurrentVersion: _string


class UpdateClusterConfigurationResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateClusterKafkaVersionRequest(ServiceRequest):
    ClusterArn: _string
    ConfigurationInfo: Optional[ConfigurationInfo]
    CurrentVersion: _string
    TargetKafkaVersion: _string


class UpdateClusterKafkaVersionResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateMonitoringRequest(ServiceRequest):
    """Request body for UpdateMonitoring."""

    ClusterArn: _string
    CurrentVersion: _string
    EnhancedMonitoring: Optional[EnhancedMonitoring]
    OpenMonitoring: Optional[OpenMonitoringInfo]
    LoggingInfo: Optional[LoggingInfo]


class UpdateMonitoringResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateReplicationInfoRequest(ServiceRequest):
    """Update information relating to replication between a given source and
    target Kafka cluster.
    """

    ConsumerGroupReplication: Optional[ConsumerGroupReplicationUpdate]
    CurrentVersion: _string
    ReplicatorArn: _string
    SourceKafkaClusterArn: _string
    TargetKafkaClusterArn: _string
    TopicReplication: Optional[TopicReplicationUpdate]


class UpdateReplicationInfoResponse(TypedDict, total=False):
    ReplicatorArn: Optional[_string]
    ReplicatorState: Optional[ReplicatorState]


class UpdateSecurityRequest(ServiceRequest):
    ClientAuthentication: Optional[ClientAuthentication]
    ClusterArn: _string
    CurrentVersion: _string
    EncryptionInfo: Optional[EncryptionInfo]


class UpdateSecurityResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateStorageRequest(ServiceRequest):
    """Request object for UpdateStorage api. Its used to update the storage
    attributes for the cluster.
    """

    ClusterArn: _string
    CurrentVersion: _string
    ProvisionedThroughput: Optional[ProvisionedThroughput]
    StorageMode: Optional[StorageMode]
    VolumeSizeGB: Optional[_integer]


class UpdateStorageResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


class UpdateConfigurationRequest(ServiceRequest):
    Arn: _string
    Description: Optional[_string]
    ServerProperties: _blob


class UpdateConfigurationResponse(TypedDict, total=False):
    Arn: Optional[_string]
    LatestRevision: Optional[ConfigurationRevision]


class UpdateConnectivityRequest(ServiceRequest):
    """Request body for UpdateConnectivity."""

    ClusterArn: _string
    ConnectivityInfo: ConnectivityInfo
    CurrentVersion: _string


class UpdateConnectivityResponse(TypedDict, total=False):
    ClusterArn: Optional[_string]
    ClusterOperationArn: Optional[_string]


_timestampUnix = datetime


class KafkaApi:
    service = "kafka"
    version = "2018-11-14"

    @handler("BatchAssociateScramSecret")
    def batch_associate_scram_secret(
        self, context: RequestContext, cluster_arn: _string, secret_arn_list: _listOf__string
    ) -> BatchAssociateScramSecretResponse:
        """Associates one or more Scram Secrets with an Amazon MSK cluster.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster to be updated.
        :param secret_arn_list: List of AWS Secrets Manager secret ARNs.
        :returns: BatchAssociateScramSecretResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("CreateCluster")
    def create_cluster(
        self,
        context: RequestContext,
        broker_node_group_info: BrokerNodeGroupInfo,
        kafka_version: _stringMin1Max128,
        number_of_broker_nodes: _integerMin1Max15,
        cluster_name: _stringMin1Max64,
        client_authentication: ClientAuthentication = None,
        configuration_info: ConfigurationInfo = None,
        encryption_info: EncryptionInfo = None,
        enhanced_monitoring: EnhancedMonitoring = None,
        open_monitoring: OpenMonitoringInfo = None,
        logging_info: LoggingInfo = None,
        tags: _mapOf__string = None,
        storage_mode: StorageMode = None,
    ) -> CreateClusterResponse:
        """Creates a new MSK cluster.

        :param broker_node_group_info: Information about the broker nodes in the cluster.
        :param kafka_version: The version of Apache Kafka.
        :param number_of_broker_nodes: The number of broker nodes in the cluster.
        :param cluster_name: The name of the cluster.
        :param client_authentication: Includes all client authentication related information.
        :param configuration_info: Represents the configuration that you want MSK to use for the brokers in
        a cluster.
        :param encryption_info: Includes all encryption-related information.
        :param enhanced_monitoring: Specifies the level of monitoring for the MSK cluster.
        :param open_monitoring: The settings for open monitoring.
        :param logging_info: .
        :param tags: Create tags when creating the cluster.
        :param storage_mode: This controls storage mode for supported storage tiers.
        :returns: CreateClusterResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises UnauthorizedException:
        :raises ForbiddenException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("CreateClusterV2")
    def create_cluster_v2(
        self,
        context: RequestContext,
        cluster_name: _stringMin1Max64,
        tags: _mapOf__string = None,
        provisioned: ProvisionedRequest = None,
        serverless: ServerlessRequest = None,
    ) -> CreateClusterV2Response:
        """Creates a new MSK cluster.

        :param cluster_name: The name of the cluster.
        :param tags: A map of tags that you want the cluster to have.
        :param provisioned: Information about the provisioned cluster.
        :param serverless: Information about the serverless cluster.
        :returns: CreateClusterV2Response
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises UnauthorizedException:
        :raises ForbiddenException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("CreateConfiguration")
    def create_configuration(
        self,
        context: RequestContext,
        server_properties: _blob,
        name: _string,
        description: _string = None,
        kafka_versions: _listOf__string = None,
    ) -> CreateConfigurationResponse:
        """Creates a new MSK configuration.

        :param server_properties: Contents of the server.
        :param name: The name of the configuration.
        :param description: The description of the configuration.
        :param kafka_versions: The versions of Apache Kafka with which you can use this MSK
        configuration.
        :returns: CreateConfigurationResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises UnauthorizedException:
        :raises ForbiddenException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("CreateReplicator")
    def create_replicator(
        self,
        context: RequestContext,
        service_execution_role_arn: _string,
        replicator_name: _stringMin1Max128Pattern09AZaZ09AZaZ0,
        replication_info_list: _listOfReplicationInfo,
        kafka_clusters: _listOfKafkaCluster,
        description: _stringMax1024 = None,
        tags: _mapOf__string = None,
    ) -> CreateReplicatorResponse:
        """Creates the replicator.

        :param service_execution_role_arn: The ARN of the IAM role used by the replicator to access resources in
        the customer's account (e.
        :param replicator_name: The name of the replicator.
        :param replication_info_list: A list of replication configurations, where each configuration targets a
        given source cluster to target cluster replication flow.
        :param kafka_clusters: Kafka Clusters to use in setting up sources / targets for replication.
        :param description: A summary description of the replicator.
        :param tags: List of tags to attach to created Replicator.
        :returns: CreateReplicatorResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("CreateVpcConnection")
    def create_vpc_connection(
        self,
        context: RequestContext,
        target_cluster_arn: _string,
        authentication: _string,
        vpc_id: _string,
        client_subnets: _listOf__string,
        security_groups: _listOf__string,
        tags: _mapOf__string = None,
    ) -> CreateVpcConnectionResponse:
        """Creates a new MSK VPC connection.

        :param target_cluster_arn: The cluster Amazon Resource Name (ARN) for the VPC connection.
        :param authentication: The authentication type of VPC connection.
        :param vpc_id: The VPC ID of VPC connection.
        :param client_subnets: The list of client subnets.
        :param security_groups: The list of security groups.
        :param tags: A map of tags for the VPC connection.
        :returns: CreateVpcConnectionResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises UnauthorizedException:
        :raises ForbiddenException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("DeleteCluster")
    def delete_cluster(
        self, context: RequestContext, cluster_arn: _string, current_version: _string = None
    ) -> DeleteClusterResponse:
        """Deletes the MSK cluster specified by the Amazon Resource Name (ARN) in
        the request.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param current_version: The current version of the MSK cluster.
        :returns: DeleteClusterResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DeleteClusterPolicy")
    def delete_cluster_policy(
        self, context: RequestContext, cluster_arn: _string
    ) -> DeleteClusterPolicyResponse:
        """Deletes the MSK cluster policy specified by the Amazon Resource Name
        (ARN) in the request.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster.
        :returns: DeleteClusterPolicyResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DeleteConfiguration")
    def delete_configuration(
        self, context: RequestContext, arn: _string
    ) -> DeleteConfigurationResponse:
        """Deletes an MSK Configuration.

        :param arn: The Amazon Resource Name (ARN) that uniquely identifies an MSK
        configuration.
        :returns: DeleteConfigurationResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DeleteReplicator")
    def delete_replicator(
        self, context: RequestContext, replicator_arn: _string, current_version: _string = None
    ) -> DeleteReplicatorResponse:
        """Deletes a replicator.

        :param replicator_arn: The Amazon Resource Name (ARN) of the replicator to be deleted.
        :param current_version: The current version of the replicator.
        :returns: DeleteReplicatorResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("DeleteVpcConnection")
    def delete_vpc_connection(
        self, context: RequestContext, arn: _string
    ) -> DeleteVpcConnectionResponse:
        """Deletes a MSK VPC connection.

        :param arn: The Amazon Resource Name (ARN) that uniquely identifies an MSK VPC
        connection.
        :returns: DeleteVpcConnectionResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeCluster")
    def describe_cluster(
        self, context: RequestContext, cluster_arn: _string
    ) -> DescribeClusterResponse:
        """Returns a description of the MSK cluster whose Amazon Resource Name
        (ARN) is specified in the request.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :returns: DescribeClusterResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeClusterV2")
    def describe_cluster_v2(
        self, context: RequestContext, cluster_arn: _string
    ) -> DescribeClusterV2Response:
        """Returns a description of the MSK cluster whose Amazon Resource Name
        (ARN) is specified in the request.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :returns: DescribeClusterV2Response
        :raises NotFoundException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeClusterOperation")
    def describe_cluster_operation(
        self, context: RequestContext, cluster_operation_arn: _string
    ) -> DescribeClusterOperationResponse:
        """Returns a description of the cluster operation specified by the ARN.

        :param cluster_operation_arn: The Amazon Resource Name (ARN) that uniquely identifies the MSK cluster
        operation.
        :returns: DescribeClusterOperationResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeClusterOperationV2")
    def describe_cluster_operation_v2(
        self, context: RequestContext, cluster_operation_arn: _string
    ) -> DescribeClusterOperationV2Response:
        """Returns a description of the cluster operation specified by the ARN.

        :param cluster_operation_arn: ARN of the cluster operation to describe.
        :returns: DescribeClusterOperationV2Response
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("DescribeConfiguration")
    def describe_configuration(
        self, context: RequestContext, arn: _string
    ) -> DescribeConfigurationResponse:
        """Returns a description of this MSK configuration.

        :param arn: The Amazon Resource Name (ARN) that uniquely identifies an MSK
        configuration and all of its revisions.
        :returns: DescribeConfigurationResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("DescribeConfigurationRevision")
    def describe_configuration_revision(
        self, context: RequestContext, revision: _long, arn: _string
    ) -> DescribeConfigurationRevisionResponse:
        """Returns a description of this revision of the configuration.

        :param revision: A string that uniquely identifies a revision of an MSK configuration.
        :param arn: The Amazon Resource Name (ARN) that uniquely identifies an MSK
        configuration and all of its revisions.
        :returns: DescribeConfigurationRevisionResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("DescribeReplicator")
    def describe_replicator(
        self, context: RequestContext, replicator_arn: _string
    ) -> DescribeReplicatorResponse:
        """Describes a replicator.

        :param replicator_arn: The Amazon Resource Name (ARN) of the replicator to be described.
        :returns: DescribeReplicatorResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("DescribeVpcConnection")
    def describe_vpc_connection(
        self, context: RequestContext, arn: _string
    ) -> DescribeVpcConnectionResponse:
        """Returns a description of this MSK VPC connection.

        :param arn: The Amazon Resource Name (ARN) that uniquely identifies a MSK VPC
        connection.
        :returns: DescribeVpcConnectionResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("BatchDisassociateScramSecret")
    def batch_disassociate_scram_secret(
        self, context: RequestContext, cluster_arn: _string, secret_arn_list: _listOf__string
    ) -> BatchDisassociateScramSecretResponse:
        """Disassociates one or more Scram Secrets from an Amazon MSK cluster.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster to be updated.
        :param secret_arn_list: List of AWS Secrets Manager secret ARNs.
        :returns: BatchDisassociateScramSecretResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("GetBootstrapBrokers")
    def get_bootstrap_brokers(
        self, context: RequestContext, cluster_arn: _string
    ) -> GetBootstrapBrokersResponse:
        """A list of brokers that a client application can use to bootstrap.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :returns: GetBootstrapBrokersResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ConflictException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("GetCompatibleKafkaVersions")
    def get_compatible_kafka_versions(
        self, context: RequestContext, cluster_arn: _string = None
    ) -> GetCompatibleKafkaVersionsResponse:
        """Gets the Apache Kafka versions to which you can update the MSK cluster.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster check.
        :returns: GetCompatibleKafkaVersionsResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("GetClusterPolicy")
    def get_cluster_policy(
        self, context: RequestContext, cluster_arn: _string
    ) -> GetClusterPolicyResponse:
        """Get the MSK cluster policy specified by the Amazon Resource Name (ARN)
        in the request.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster.
        :returns: GetClusterPolicyResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListClusterOperations")
    def list_cluster_operations(
        self,
        context: RequestContext,
        cluster_arn: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListClusterOperationsResponse:
        """Returns a list of all the operations that have been performed on the
        specified MSK cluster.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListClusterOperationsResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises UnauthorizedException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListClusterOperationsV2")
    def list_cluster_operations_v2(
        self,
        context: RequestContext,
        cluster_arn: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListClusterOperationsV2Response:
        """Returns a list of all the operations that have been performed on the
        specified MSK cluster.

        :param cluster_arn: The arn of the cluster whose operations are being requested.
        :param max_results: The maxResults of the query.
        :param next_token: The nextToken of the query.
        :returns: ListClusterOperationsV2Response
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("ListClusters")
    def list_clusters(
        self,
        context: RequestContext,
        cluster_name_filter: _string = None,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListClustersResponse:
        """Returns a list of all the MSK clusters in the current Region.

        :param cluster_name_filter: Specify a prefix of the name of the clusters that you want to list.
        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListClustersResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises UnauthorizedException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListClustersV2")
    def list_clusters_v2(
        self,
        context: RequestContext,
        cluster_name_filter: _string = None,
        cluster_type_filter: _string = None,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListClustersV2Response:
        """Returns a list of all the MSK clusters in the current Region.

        :param cluster_name_filter: Specify a prefix of the names of the clusters that you want to list.
        :param cluster_type_filter: Specify either PROVISIONED or SERVERLESS.
        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListClustersV2Response
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises UnauthorizedException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListConfigurationRevisions")
    def list_configuration_revisions(
        self,
        context: RequestContext,
        arn: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListConfigurationRevisionsResponse:
        """Returns a list of all the MSK configurations in this Region.

        :param arn: The Amazon Resource Name (ARN) that uniquely identifies an MSK
        configuration and all of its revisions.
        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListConfigurationRevisionsResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("ListConfigurations")
    def list_configurations(
        self, context: RequestContext, max_results: MaxResults = None, next_token: _string = None
    ) -> ListConfigurationsResponse:
        """Returns a list of all the MSK configurations in this Region.

        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListConfigurationsResponse
        :raises ServiceUnavailableException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListKafkaVersions")
    def list_kafka_versions(
        self, context: RequestContext, max_results: MaxResults = None, next_token: _string = None
    ) -> ListKafkaVersionsResponse:
        """Returns a list of Apache Kafka versions.

        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListKafkaVersionsResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListNodes")
    def list_nodes(
        self,
        context: RequestContext,
        cluster_arn: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListNodesResponse:
        """Returns a list of the broker nodes in the cluster.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListNodesResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListReplicators")
    def list_replicators(
        self,
        context: RequestContext,
        max_results: MaxResults = None,
        next_token: _string = None,
        replicator_name_filter: _string = None,
    ) -> ListReplicatorsResponse:
        """Lists the replicators.

        :param max_results: The maximum number of results to return in the response.
        :param next_token: If the response of ListReplicators is truncated, it returns a NextToken
        in the response.
        :param replicator_name_filter: Returns replicators starting with given name.
        :returns: ListReplicatorsResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("ListScramSecrets")
    def list_scram_secrets(
        self,
        context: RequestContext,
        cluster_arn: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListScramSecretsResponse:
        """Returns a list of the Scram Secrets associated with an Amazon MSK
        cluster.

        :param cluster_arn: The arn of the cluster.
        :param max_results: The maxResults of the query.
        :param next_token: The nextToken of the query.
        :returns: ListScramSecretsResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(
        self, context: RequestContext, resource_arn: _string
    ) -> ListTagsForResourceResponse:
        """Returns a list of the tags associated with the specified resource.

        :param resource_arn: The Amazon Resource Name (ARN) that uniquely identifies the resource
        that's associated with the tags.
        :returns: ListTagsForResourceResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        """
        raise NotImplementedError

    @handler("ListClientVpcConnections")
    def list_client_vpc_connections(
        self,
        context: RequestContext,
        cluster_arn: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListClientVpcConnectionsResponse:
        """Returns a list of all the VPC connections in this Region.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster.
        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListClientVpcConnectionsResponse
        :raises ServiceUnavailableException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListVpcConnections")
    def list_vpc_connections(
        self, context: RequestContext, max_results: MaxResults = None, next_token: _string = None
    ) -> ListVpcConnectionsResponse:
        """Returns a list of all the VPC connections in this Region.

        :param max_results: The maximum number of results to return in the response.
        :param next_token: The paginated results marker.
        :returns: ListVpcConnectionsResponse
        :raises ServiceUnavailableException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("RejectClientVpcConnection")
    def reject_client_vpc_connection(
        self, context: RequestContext, vpc_connection_arn: _string, cluster_arn: _string
    ) -> RejectClientVpcConnectionResponse:
        """Returns empty response.

        :param vpc_connection_arn: The VPC connection ARN.
        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster.
        :returns: RejectClientVpcConnectionResponse
        :raises ServiceUnavailableException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("PutClusterPolicy")
    def put_cluster_policy(
        self,
        context: RequestContext,
        cluster_arn: _string,
        policy: _string,
        current_version: _string = None,
    ) -> PutClusterPolicyResponse:
        """Creates or updates the MSK cluster policy specified by the cluster
        Amazon Resource Name (ARN) in the request.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster.
        :param policy: The policy.
        :param current_version: The policy version.
        :returns: PutClusterPolicyResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("RebootBroker")
    def reboot_broker(
        self, context: RequestContext, cluster_arn: _string, broker_ids: _listOf__string
    ) -> RebootBrokerResponse:
        """Reboots brokers.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster to be updated.
        :param broker_ids: The list of broker IDs to be rebooted.
        :returns: RebootBrokerResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(
        self, context: RequestContext, resource_arn: _string, tags: _mapOf__string
    ) -> None:
        """Adds tags to the specified MSK resource.

        :param resource_arn: The Amazon Resource Name (ARN) that uniquely identifies the resource
        that's associated with the tags.
        :param tags: The key-value pair for the resource tag.
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        """
        raise NotImplementedError

    @handler("UntagResource")
    def untag_resource(
        self, context: RequestContext, tag_keys: _listOf__string, resource_arn: _string
    ) -> None:
        """Removes the tags associated with the keys that are provided in the
        query.

        :param tag_keys: Tag keys must be unique for a given cluster.
        :param resource_arn: The Amazon Resource Name (ARN) that uniquely identifies the resource
        that's associated with the tags.
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        """
        raise NotImplementedError

    @handler("UpdateBrokerCount")
    def update_broker_count(
        self,
        context: RequestContext,
        cluster_arn: _string,
        current_version: _string,
        target_number_of_broker_nodes: _integerMin1Max15,
    ) -> UpdateBrokerCountResponse:
        """Updates the number of broker nodes in the cluster.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param current_version: The version of cluster to update from.
        :param target_number_of_broker_nodes: The number of broker nodes that you want the cluster to have after this
        operation completes successfully.
        :returns: UpdateBrokerCountResponse
        :raises ServiceUnavailableException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("UpdateBrokerType")
    def update_broker_type(
        self,
        context: RequestContext,
        cluster_arn: _string,
        current_version: _string,
        target_instance_type: _string,
    ) -> UpdateBrokerTypeResponse:
        """Updates EC2 instance type.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param current_version: The cluster version that you want to change.
        :param target_instance_type: The Amazon MSK broker type that you want all of the brokers in this
        cluster to be.
        :returns: UpdateBrokerTypeResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("UpdateBrokerStorage")
    def update_broker_storage(
        self,
        context: RequestContext,
        cluster_arn: _string,
        target_broker_ebs_volume_info: _listOfBrokerEBSVolumeInfo,
        current_version: _string,
    ) -> UpdateBrokerStorageResponse:
        """Updates the EBS storage associated with MSK brokers.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param target_broker_ebs_volume_info: Describes the target volume size and the ID of the broker to apply the
        update to.
        :param current_version: The version of cluster to update from.
        :returns: UpdateBrokerStorageResponse
        :raises ServiceUnavailableException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("UpdateConfiguration")
    def update_configuration(
        self,
        context: RequestContext,
        arn: _string,
        server_properties: _blob,
        description: _string = None,
    ) -> UpdateConfigurationResponse:
        """Updates an MSK configuration.

        :param arn: The Amazon Resource Name (ARN) of the configuration.
        :param server_properties: Contents of the server.
        :param description: The description of the configuration revision.
        :returns: UpdateConfigurationResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("UpdateConnectivity")
    def update_connectivity(
        self,
        context: RequestContext,
        cluster_arn: _string,
        connectivity_info: ConnectivityInfo,
        current_version: _string,
    ) -> UpdateConnectivityResponse:
        """Updates the cluster's connectivity configuration.

        :param cluster_arn: The Amazon Resource Name (ARN) of the configuration.
        :param connectivity_info: Information about the broker access configuration.
        :param current_version: The version of the MSK cluster to update.
        :returns: UpdateConnectivityResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("UpdateClusterConfiguration")
    def update_cluster_configuration(
        self,
        context: RequestContext,
        cluster_arn: _string,
        current_version: _string,
        configuration_info: ConfigurationInfo,
    ) -> UpdateClusterConfigurationResponse:
        """Updates the cluster with the configuration that is specified in the
        request body.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param current_version: The version of the cluster that needs to be updated.
        :param configuration_info: Represents the configuration that you want MSK to use for the brokers in
        a cluster.
        :returns: UpdateClusterConfigurationResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("UpdateClusterKafkaVersion")
    def update_cluster_kafka_version(
        self,
        context: RequestContext,
        cluster_arn: _string,
        target_kafka_version: _string,
        current_version: _string,
        configuration_info: ConfigurationInfo = None,
    ) -> UpdateClusterKafkaVersionResponse:
        """Updates the Apache Kafka version for the cluster.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster to be updated.
        :param target_kafka_version: Target Kafka version.
        :param current_version: Current cluster version.
        :param configuration_info: The custom configuration that should be applied on the new version of
        cluster.
        :returns: UpdateClusterKafkaVersionResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("UpdateMonitoring")
    def update_monitoring(
        self,
        context: RequestContext,
        cluster_arn: _string,
        current_version: _string,
        enhanced_monitoring: EnhancedMonitoring = None,
        open_monitoring: OpenMonitoringInfo = None,
        logging_info: LoggingInfo = None,
    ) -> UpdateMonitoringResponse:
        """Updates the monitoring settings for the cluster. You can use this
        operation to specify which Apache Kafka metrics you want Amazon MSK to
        send to Amazon CloudWatch. You can also specify settings for open
        monitoring with Prometheus.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param current_version: The version of the MSK cluster to update.
        :param enhanced_monitoring: Specifies which Apache Kafka metrics Amazon MSK gathers and sends to
        Amazon CloudWatch for this cluster.
        :param open_monitoring: The settings for open monitoring.
        :param logging_info: .
        :returns: UpdateMonitoringResponse
        :raises ServiceUnavailableException:
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("UpdateReplicationInfo")
    def update_replication_info(
        self,
        context: RequestContext,
        replicator_arn: _string,
        source_kafka_cluster_arn: _string,
        current_version: _string,
        target_kafka_cluster_arn: _string,
        consumer_group_replication: ConsumerGroupReplicationUpdate = None,
        topic_replication: TopicReplicationUpdate = None,
    ) -> UpdateReplicationInfoResponse:
        """Updates replication info of a replicator.

        :param replicator_arn: The Amazon Resource Name (ARN) of the replicator to be updated.
        :param source_kafka_cluster_arn: The ARN of the source Kafka cluster.
        :param current_version: Current replicator version.
        :param target_kafka_cluster_arn: The ARN of the target Kafka cluster.
        :param consumer_group_replication: Updated consumer group replication information.
        :param topic_replication: Updated topic replication information.
        :returns: UpdateReplicationInfoResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("UpdateSecurity")
    def update_security(
        self,
        context: RequestContext,
        cluster_arn: _string,
        current_version: _string,
        client_authentication: ClientAuthentication = None,
        encryption_info: EncryptionInfo = None,
    ) -> UpdateSecurityResponse:
        """Updates the security settings for the cluster. You can use this
        operation to specify encryption and authentication on existing clusters.

        :param cluster_arn: The Amazon Resource Name (ARN) that uniquely identifies the cluster.
        :param current_version: The version of the MSK cluster to update.
        :param client_authentication: Includes all client authentication related information.
        :param encryption_info: Includes all encryption-related information.
        :returns: UpdateSecurityResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("UpdateStorage")
    def update_storage(
        self,
        context: RequestContext,
        cluster_arn: _string,
        current_version: _string,
        provisioned_throughput: ProvisionedThroughput = None,
        storage_mode: StorageMode = None,
        volume_size_gb: _integer = None,
    ) -> UpdateStorageResponse:
        """Updates cluster broker volume size (or) sets cluster storage mode to
        TIERED.

        :param cluster_arn: The Amazon Resource Name (ARN) of the cluster to be updated.
        :param current_version: The version of cluster to update from.
        :param provisioned_throughput: EBS volume provisioned throughput information.
        :param storage_mode: Controls storage mode for supported storage tiers.
        :param volume_size_gb: size of the EBS volume to update.
        :returns: UpdateStorageResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises NotFoundException:
        :raises ServiceUnavailableException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError
