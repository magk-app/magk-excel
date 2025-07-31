from datetime import datetime
from typing import Dict, List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

MaxResults = int
_boolean = bool
_double = float
_integer = int
_integerMin5Max100 = int
_string = str


class AuthenticationStrategy(str):
    SIMPLE = "SIMPLE"
    LDAP = "LDAP"


class BrokerState(str):
    CREATION_IN_PROGRESS = "CREATION_IN_PROGRESS"
    CREATION_FAILED = "CREATION_FAILED"
    DELETION_IN_PROGRESS = "DELETION_IN_PROGRESS"
    RUNNING = "RUNNING"
    REBOOT_IN_PROGRESS = "REBOOT_IN_PROGRESS"
    CRITICAL_ACTION_REQUIRED = "CRITICAL_ACTION_REQUIRED"
    REPLICA = "REPLICA"


class BrokerStorageType(str):
    EBS = "EBS"
    EFS = "EFS"


class ChangeType(str):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class DataReplicationMode(str):
    NONE = "NONE"
    CRDR = "CRDR"


class DayOfWeek(str):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"


class DeploymentMode(str):
    SINGLE_INSTANCE = "SINGLE_INSTANCE"
    ACTIVE_STANDBY_MULTI_AZ = "ACTIVE_STANDBY_MULTI_AZ"
    CLUSTER_MULTI_AZ = "CLUSTER_MULTI_AZ"


class EngineType(str):
    ACTIVEMQ = "ACTIVEMQ"
    RABBITMQ = "RABBITMQ"


class PromoteMode(str):
    SWITCHOVER = "SWITCHOVER"
    FAILOVER = "FAILOVER"


class SanitizationWarningReason(str):
    DISALLOWED_ELEMENT_REMOVED = "DISALLOWED_ELEMENT_REMOVED"
    DISALLOWED_ATTRIBUTE_REMOVED = "DISALLOWED_ATTRIBUTE_REMOVED"
    INVALID_ATTRIBUTE_VALUE_REMOVED = "INVALID_ATTRIBUTE_VALUE_REMOVED"


class BadRequestException(ServiceException):
    """Returns information about an error."""

    code: str = "BadRequestException"
    sender_fault: bool = False
    status_code: int = 400
    ErrorAttribute: Optional[_string]


class ConflictException(ServiceException):
    """Returns information about an error."""

    code: str = "ConflictException"
    sender_fault: bool = False
    status_code: int = 409
    ErrorAttribute: Optional[_string]


class ForbiddenException(ServiceException):
    """Returns information about an error."""

    code: str = "ForbiddenException"
    sender_fault: bool = False
    status_code: int = 403
    ErrorAttribute: Optional[_string]


class InternalServerErrorException(ServiceException):
    """Returns information about an error."""

    code: str = "InternalServerErrorException"
    sender_fault: bool = False
    status_code: int = 500
    ErrorAttribute: Optional[_string]


class NotFoundException(ServiceException):
    """Returns information about an error."""

    code: str = "NotFoundException"
    sender_fault: bool = False
    status_code: int = 404
    ErrorAttribute: Optional[_string]


class UnauthorizedException(ServiceException):
    """Returns information about an error."""

    code: str = "UnauthorizedException"
    sender_fault: bool = False
    status_code: int = 401
    ErrorAttribute: Optional[_string]


class ActionRequired(TypedDict, total=False):
    """Action required for a broker."""

    ActionRequiredCode: Optional[_string]
    ActionRequiredInfo: Optional[_string]


class AvailabilityZone(TypedDict, total=False):
    """Name of the availability zone."""

    Name: Optional[_string]


class EngineVersion(TypedDict, total=False):
    """Id of the engine version."""

    Name: Optional[_string]


_listOfEngineVersion = List[EngineVersion]


class BrokerEngineType(TypedDict, total=False):
    """Types of broker engines."""

    EngineType: Optional[EngineType]
    EngineVersions: Optional[_listOfEngineVersion]


_listOfBrokerEngineType = List[BrokerEngineType]


class BrokerEngineTypeOutput(TypedDict, total=False):
    """Returns a list of broker engine type."""

    BrokerEngineTypes: Optional[_listOfBrokerEngineType]
    MaxResults: _integerMin5Max100
    NextToken: Optional[_string]


_listOf__string = List[_string]


class BrokerInstance(TypedDict, total=False):
    """Returns information about all brokers."""

    ConsoleURL: Optional[_string]
    Endpoints: Optional[_listOf__string]
    IpAddress: Optional[_string]


_listOfDeploymentMode = List[DeploymentMode]
_listOfAvailabilityZone = List[AvailabilityZone]


class BrokerInstanceOption(TypedDict, total=False):
    """Option for host instance type."""

    AvailabilityZones: Optional[_listOfAvailabilityZone]
    EngineType: Optional[EngineType]
    HostInstanceType: Optional[_string]
    StorageType: Optional[BrokerStorageType]
    SupportedDeploymentModes: Optional[_listOfDeploymentMode]
    SupportedEngineVersions: Optional[_listOf__string]


_listOfBrokerInstanceOption = List[BrokerInstanceOption]


class BrokerInstanceOptionsOutput(TypedDict, total=False):
    """Returns a list of broker instance options."""

    BrokerInstanceOptions: Optional[_listOfBrokerInstanceOption]
    MaxResults: _integerMin5Max100
    NextToken: Optional[_string]


_timestampIso8601 = datetime


class BrokerSummary(TypedDict, total=False):
    """Returns information about all brokers."""

    BrokerArn: Optional[_string]
    BrokerId: Optional[_string]
    BrokerName: Optional[_string]
    BrokerState: Optional[BrokerState]
    Created: Optional[_timestampIso8601]
    DeploymentMode: DeploymentMode
    EngineType: EngineType
    HostInstanceType: Optional[_string]


_mapOf__string = Dict[_string, _string]


class ConfigurationRevision(TypedDict, total=False):
    """Returns information about the specified configuration revision."""

    Created: _timestampIso8601
    Description: Optional[_string]
    Revision: _integer


class Configuration(TypedDict, total=False):
    """Returns information about all configurations."""

    Arn: _string
    AuthenticationStrategy: AuthenticationStrategy
    Created: _timestampIso8601
    Description: _string
    EngineType: EngineType
    EngineVersion: _string
    Id: _string
    LatestRevision: ConfigurationRevision
    Name: _string
    Tags: Optional[_mapOf__string]


class ConfigurationId(TypedDict, total=False):
    """A list of information about the configuration."""

    Id: _string
    Revision: Optional[_integer]


_listOfConfigurationId = List[ConfigurationId]


class Configurations(TypedDict, total=False):
    """Broker configuration information"""

    Current: Optional[ConfigurationId]
    History: Optional[_listOfConfigurationId]
    Pending: Optional[ConfigurationId]


class User(TypedDict, total=False):
    """A user associated with the broker. For Amazon MQ for RabbitMQ brokers,
    one and only one administrative user is accepted and created when a
    broker is first provisioned. All subsequent broker users are created by
    making RabbitMQ API calls directly to brokers or via the RabbitMQ web
    console.
    """

    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    Password: _string
    Username: _string
    ReplicationUser: Optional[_boolean]


_listOfUser = List[User]


class WeeklyStartTime(TypedDict, total=False):
    """The scheduled time period relative to UTC during which Amazon MQ begins
    to apply pending updates or patches to the broker.
    """

    DayOfWeek: DayOfWeek
    TimeOfDay: _string
    TimeZone: Optional[_string]


class Logs(TypedDict, total=False):
    """The list of information about logs to be enabled for the specified
    broker.
    """

    Audit: Optional[_boolean]
    General: Optional[_boolean]


class LdapServerMetadataInput(TypedDict, total=False):
    """Optional. The metadata of the LDAP server used to authenticate and
    authorize connections to the broker.

    Does not apply to RabbitMQ brokers.
    """

    Hosts: _listOf__string
    RoleBase: _string
    RoleName: Optional[_string]
    RoleSearchMatching: _string
    RoleSearchSubtree: Optional[_boolean]
    ServiceAccountPassword: _string
    ServiceAccountUsername: _string
    UserBase: _string
    UserRoleName: Optional[_string]
    UserSearchMatching: _string
    UserSearchSubtree: Optional[_boolean]


class EncryptionOptions(TypedDict, total=False):
    """Encryption options for the broker."""

    KmsKeyId: Optional[_string]
    UseAwsOwnedKey: _boolean


class CreateBrokerInput(TypedDict, total=False):
    """Creates a broker."""

    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: _boolean
    BrokerName: _string
    Configuration: Optional[ConfigurationId]
    CreatorRequestId: Optional[_string]
    DeploymentMode: DeploymentMode
    DataReplicationMode: Optional[DataReplicationMode]
    DataReplicationPrimaryBrokerArn: Optional[_string]
    EncryptionOptions: Optional[EncryptionOptions]
    EngineType: EngineType
    EngineVersion: _string
    HostInstanceType: _string
    LdapServerMetadata: Optional[LdapServerMetadataInput]
    Logs: Optional[Logs]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    PubliclyAccessible: _boolean
    SecurityGroups: Optional[_listOf__string]
    StorageType: Optional[BrokerStorageType]
    SubnetIds: Optional[_listOf__string]
    Tags: Optional[_mapOf__string]
    Users: _listOfUser


class CreateBrokerOutput(TypedDict, total=False):
    """Returns information about the created broker."""

    BrokerArn: Optional[_string]
    BrokerId: Optional[_string]


class CreateBrokerRequest(ServiceRequest):
    """Creates a broker using the specified properties."""

    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: _boolean
    BrokerName: _string
    Configuration: Optional[ConfigurationId]
    CreatorRequestId: Optional[_string]
    DeploymentMode: DeploymentMode
    EncryptionOptions: Optional[EncryptionOptions]
    EngineType: EngineType
    EngineVersion: _string
    HostInstanceType: _string
    LdapServerMetadata: Optional[LdapServerMetadataInput]
    Logs: Optional[Logs]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    PubliclyAccessible: _boolean
    SecurityGroups: Optional[_listOf__string]
    StorageType: Optional[BrokerStorageType]
    SubnetIds: Optional[_listOf__string]
    Tags: Optional[_mapOf__string]
    Users: _listOfUser
    DataReplicationMode: Optional[DataReplicationMode]
    DataReplicationPrimaryBrokerArn: Optional[_string]


class CreateBrokerResponse(TypedDict, total=False):
    BrokerArn: Optional[_string]
    BrokerId: Optional[_string]


class CreateConfigurationInput(TypedDict, total=False):
    """Creates a new configuration for the specified configuration name. Amazon
    MQ uses the default configuration (the engine type and version).
    """

    AuthenticationStrategy: Optional[AuthenticationStrategy]
    EngineType: EngineType
    EngineVersion: _string
    Name: _string
    Tags: Optional[_mapOf__string]


class CreateConfigurationOutput(TypedDict, total=False):
    """Returns information about the created configuration."""

    Arn: _string
    AuthenticationStrategy: AuthenticationStrategy
    Created: _timestampIso8601
    Id: _string
    LatestRevision: Optional[ConfigurationRevision]
    Name: _string


class CreateConfigurationRequest(ServiceRequest):
    """Creates a new configuration for the specified configuration name. Amazon
    MQ uses the default configuration (the engine type and version).
    """

    AuthenticationStrategy: Optional[AuthenticationStrategy]
    EngineType: EngineType
    EngineVersion: _string
    Name: _string
    Tags: Optional[_mapOf__string]


class CreateConfigurationResponse(TypedDict, total=False):
    Arn: Optional[_string]
    AuthenticationStrategy: Optional[AuthenticationStrategy]
    Created: Optional[_timestampIso8601]
    Id: Optional[_string]
    LatestRevision: Optional[ConfigurationRevision]
    Name: Optional[_string]


class CreateTagsRequest(ServiceRequest):
    """A map of the key-value pairs for the resource tag."""

    ResourceArn: _string
    Tags: Optional[_mapOf__string]


class CreateUserInput(TypedDict, total=False):
    """Creates a new ActiveMQ user."""

    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    Password: _string
    ReplicationUser: Optional[_boolean]


class CreateUserRequest(ServiceRequest):
    """Creates a new ActiveMQ user."""

    BrokerId: _string
    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    Password: _string
    Username: _string
    ReplicationUser: Optional[_boolean]


class CreateUserResponse(TypedDict, total=False):
    pass


class DataReplicationCounterpart(TypedDict, total=False):
    """Specifies a broker in a data replication pair."""

    BrokerId: _string
    Region: _string


class DataReplicationMetadataOutput(TypedDict, total=False):
    """The replication details of the data replication-enabled broker. Only
    returned if dataReplicationMode or pendingDataReplicationMode is set to
    CRDR.
    """

    DataReplicationCounterpart: Optional[DataReplicationCounterpart]
    DataReplicationRole: _string


class DeleteBrokerOutput(TypedDict, total=False):
    """Returns information about the deleted broker."""

    BrokerId: Optional[_string]


class DeleteBrokerRequest(ServiceRequest):
    BrokerId: _string


class DeleteBrokerResponse(TypedDict, total=False):
    BrokerId: Optional[_string]


class DeleteTagsRequest(ServiceRequest):
    ResourceArn: _string
    TagKeys: _listOf__string


class DeleteUserRequest(ServiceRequest):
    BrokerId: _string
    Username: _string


class DeleteUserResponse(TypedDict, total=False):
    pass


class DescribeBrokerEngineTypesRequest(ServiceRequest):
    EngineType: Optional[_string]
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class DescribeBrokerEngineTypesResponse(TypedDict, total=False):
    BrokerEngineTypes: Optional[_listOfBrokerEngineType]
    MaxResults: Optional[_integerMin5Max100]
    NextToken: Optional[_string]


class DescribeBrokerInstanceOptionsRequest(ServiceRequest):
    EngineType: Optional[_string]
    HostInstanceType: Optional[_string]
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]
    StorageType: Optional[_string]


class DescribeBrokerInstanceOptionsResponse(TypedDict, total=False):
    BrokerInstanceOptions: Optional[_listOfBrokerInstanceOption]
    MaxResults: Optional[_integerMin5Max100]
    NextToken: Optional[_string]


class UserSummary(TypedDict, total=False):
    """Returns a list of all broker users. Does not apply to RabbitMQ brokers."""

    PendingChange: Optional[ChangeType]
    Username: _string


_listOfUserSummary = List[UserSummary]


class LdapServerMetadataOutput(TypedDict, total=False):
    """Optional. The metadata of the LDAP server used to authenticate and
    authorize connections to the broker.
    """

    Hosts: _listOf__string
    RoleBase: _string
    RoleName: Optional[_string]
    RoleSearchMatching: _string
    RoleSearchSubtree: Optional[_boolean]
    ServiceAccountUsername: _string
    UserBase: _string
    UserRoleName: Optional[_string]
    UserSearchMatching: _string
    UserSearchSubtree: Optional[_boolean]


class PendingLogs(TypedDict, total=False):
    """The list of information about logs to be enabled for the specified
    broker.
    """

    Audit: Optional[_boolean]
    General: Optional[_boolean]


class LogsSummary(TypedDict, total=False):
    """The list of information about logs currently enabled and pending to be
    deployed for the specified broker.
    """

    Audit: Optional[_boolean]
    AuditLogGroup: Optional[_string]
    General: _boolean
    GeneralLogGroup: _string
    Pending: Optional[PendingLogs]


_listOfBrokerInstance = List[BrokerInstance]
_listOfActionRequired = List[ActionRequired]


class DescribeBrokerOutput(TypedDict, total=False):
    """Returns information about the specified broker."""

    ActionsRequired: Optional[_listOfActionRequired]
    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: _boolean
    BrokerArn: Optional[_string]
    BrokerId: Optional[_string]
    BrokerInstances: Optional[_listOfBrokerInstance]
    BrokerName: Optional[_string]
    BrokerState: Optional[BrokerState]
    Configurations: Optional[Configurations]
    Created: Optional[_timestampIso8601]
    DeploymentMode: DeploymentMode
    DataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    DataReplicationMode: Optional[DataReplicationMode]
    EncryptionOptions: Optional[EncryptionOptions]
    EngineType: EngineType
    EngineVersion: Optional[_string]
    HostInstanceType: Optional[_string]
    LdapServerMetadata: Optional[LdapServerMetadataOutput]
    Logs: Optional[LogsSummary]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    PendingAuthenticationStrategy: Optional[AuthenticationStrategy]
    PendingDataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    PendingDataReplicationMode: Optional[DataReplicationMode]
    PendingEngineVersion: Optional[_string]
    PendingHostInstanceType: Optional[_string]
    PendingLdapServerMetadata: Optional[LdapServerMetadataOutput]
    PendingSecurityGroups: Optional[_listOf__string]
    PubliclyAccessible: _boolean
    SecurityGroups: Optional[_listOf__string]
    StorageType: Optional[BrokerStorageType]
    SubnetIds: Optional[_listOf__string]
    Tags: Optional[_mapOf__string]
    Users: Optional[_listOfUserSummary]


class DescribeBrokerRequest(ServiceRequest):
    BrokerId: _string


class DescribeBrokerResponse(TypedDict, total=False):
    ActionsRequired: Optional[_listOfActionRequired]
    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: Optional[_boolean]
    BrokerArn: Optional[_string]
    BrokerId: Optional[_string]
    BrokerInstances: Optional[_listOfBrokerInstance]
    BrokerName: Optional[_string]
    BrokerState: Optional[BrokerState]
    Configurations: Optional[Configurations]
    Created: Optional[_timestampIso8601]
    DeploymentMode: Optional[DeploymentMode]
    EncryptionOptions: Optional[EncryptionOptions]
    EngineType: Optional[EngineType]
    EngineVersion: Optional[_string]
    HostInstanceType: Optional[_string]
    LdapServerMetadata: Optional[LdapServerMetadataOutput]
    Logs: Optional[LogsSummary]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    PendingAuthenticationStrategy: Optional[AuthenticationStrategy]
    PendingEngineVersion: Optional[_string]
    PendingHostInstanceType: Optional[_string]
    PendingLdapServerMetadata: Optional[LdapServerMetadataOutput]
    PendingSecurityGroups: Optional[_listOf__string]
    PubliclyAccessible: Optional[_boolean]
    SecurityGroups: Optional[_listOf__string]
    StorageType: Optional[BrokerStorageType]
    SubnetIds: Optional[_listOf__string]
    Tags: Optional[_mapOf__string]
    Users: Optional[_listOfUserSummary]
    DataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    DataReplicationMode: Optional[DataReplicationMode]
    PendingDataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    PendingDataReplicationMode: Optional[DataReplicationMode]


class DescribeConfigurationRequest(ServiceRequest):
    ConfigurationId: _string


class DescribeConfigurationResponse(TypedDict, total=False):
    Arn: Optional[_string]
    AuthenticationStrategy: Optional[AuthenticationStrategy]
    Created: Optional[_timestampIso8601]
    Description: Optional[_string]
    EngineType: Optional[EngineType]
    EngineVersion: Optional[_string]
    Id: Optional[_string]
    LatestRevision: Optional[ConfigurationRevision]
    Name: Optional[_string]
    Tags: Optional[_mapOf__string]


class DescribeConfigurationRevisionOutput(TypedDict, total=False):
    """Returns the specified configuration revision for the specified
    configuration.
    """

    ConfigurationId: _string
    Created: _timestampIso8601
    Data: _string
    Description: Optional[_string]


class DescribeConfigurationRevisionRequest(ServiceRequest):
    ConfigurationId: _string
    ConfigurationRevision: _string


class DescribeConfigurationRevisionResponse(TypedDict, total=False):
    ConfigurationId: Optional[_string]
    Created: Optional[_timestampIso8601]
    Data: Optional[_string]
    Description: Optional[_string]


class UserPendingChanges(TypedDict, total=False):
    """Returns information about the status of the changes pending for the
    ActiveMQ user.
    """

    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    PendingChange: ChangeType


class DescribeUserOutput(TypedDict, total=False):
    """Returns information about an ActiveMQ user."""

    BrokerId: _string
    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    Pending: Optional[UserPendingChanges]
    ReplicationUser: Optional[_boolean]
    Username: _string


class DescribeUserRequest(ServiceRequest):
    BrokerId: _string
    Username: _string


class DescribeUserResponse(TypedDict, total=False):
    BrokerId: Optional[_string]
    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    Pending: Optional[UserPendingChanges]
    Username: Optional[_string]
    ReplicationUser: Optional[_boolean]


class Error(TypedDict, total=False):
    """Returns information about an error."""

    ErrorAttribute: Optional[_string]
    Message: Optional[_string]


_listOfBrokerSummary = List[BrokerSummary]


class ListBrokersOutput(TypedDict, total=False):
    """A list of information about all brokers."""

    BrokerSummaries: Optional[_listOfBrokerSummary]
    NextToken: Optional[_string]


class ListBrokersRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ListBrokersResponse(TypedDict, total=False):
    BrokerSummaries: Optional[_listOfBrokerSummary]
    NextToken: Optional[_string]


_listOfConfigurationRevision = List[ConfigurationRevision]


class ListConfigurationRevisionsOutput(TypedDict, total=False):
    """Returns a list of all revisions for the specified configuration."""

    ConfigurationId: Optional[_string]
    MaxResults: Optional[_integer]
    NextToken: Optional[_string]
    Revisions: Optional[_listOfConfigurationRevision]


class ListConfigurationRevisionsRequest(ServiceRequest):
    ConfigurationId: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ListConfigurationRevisionsResponse(TypedDict, total=False):
    ConfigurationId: Optional[_string]
    MaxResults: Optional[_integer]
    NextToken: Optional[_string]
    Revisions: Optional[_listOfConfigurationRevision]


_listOfConfiguration = List[Configuration]


class ListConfigurationsOutput(TypedDict, total=False):
    """Returns a list of all configurations."""

    Configurations: Optional[_listOfConfiguration]
    MaxResults: Optional[_integer]
    NextToken: Optional[_string]


class ListConfigurationsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ListConfigurationsResponse(TypedDict, total=False):
    Configurations: Optional[_listOfConfiguration]
    MaxResults: Optional[_integer]
    NextToken: Optional[_string]


class ListTagsRequest(ServiceRequest):
    ResourceArn: _string


class ListTagsResponse(TypedDict, total=False):
    Tags: Optional[_mapOf__string]


class ListUsersOutput(TypedDict, total=False):
    """Returns a list of all ActiveMQ users."""

    BrokerId: _string
    MaxResults: _integerMin5Max100
    NextToken: Optional[_string]
    Users: _listOfUserSummary


class ListUsersRequest(ServiceRequest):
    BrokerId: _string
    MaxResults: Optional[MaxResults]
    NextToken: Optional[_string]


class ListUsersResponse(TypedDict, total=False):
    BrokerId: Optional[_string]
    MaxResults: Optional[_integerMin5Max100]
    NextToken: Optional[_string]
    Users: Optional[_listOfUserSummary]


class PromoteInput(TypedDict, total=False):
    """Creates a Promote request with the properties specified."""

    Mode: PromoteMode


class PromoteOutput(TypedDict, total=False):
    """Returns information about the updated broker."""

    BrokerId: Optional[_string]


class PromoteRequest(ServiceRequest):
    """Promotes a data replication replica broker to the primary broker role."""

    BrokerId: _string
    Mode: PromoteMode


class PromoteResponse(TypedDict, total=False):
    BrokerId: Optional[_string]


class RebootBrokerRequest(ServiceRequest):
    BrokerId: _string


class RebootBrokerResponse(TypedDict, total=False):
    pass


class SanitizationWarning(TypedDict, total=False):
    """Returns information about the configuration element or attribute that
    was sanitized in the configuration.
    """

    AttributeName: Optional[_string]
    ElementName: Optional[_string]
    Reason: SanitizationWarningReason


class Tags(TypedDict, total=False):
    """A map of the key-value pairs for the resource tag."""

    Tags: Optional[_mapOf__string]


class UpdateBrokerInput(TypedDict, total=False):
    """Updates the broker using the specified properties."""

    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: Optional[_boolean]
    Configuration: Optional[ConfigurationId]
    DataReplicationMode: Optional[DataReplicationMode]
    EngineVersion: Optional[_string]
    HostInstanceType: Optional[_string]
    LdapServerMetadata: Optional[LdapServerMetadataInput]
    Logs: Optional[Logs]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    SecurityGroups: Optional[_listOf__string]


class UpdateBrokerOutput(TypedDict, total=False):
    """Returns information about the updated broker."""

    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: Optional[_boolean]
    BrokerId: _string
    Configuration: Optional[ConfigurationId]
    DataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    DataReplicationMode: Optional[DataReplicationMode]
    EngineVersion: Optional[_string]
    HostInstanceType: Optional[_string]
    LdapServerMetadata: Optional[LdapServerMetadataOutput]
    Logs: Optional[Logs]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    PendingDataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    PendingDataReplicationMode: Optional[DataReplicationMode]
    SecurityGroups: Optional[_listOf__string]


class UpdateBrokerRequest(ServiceRequest):
    """Updates the broker using the specified properties."""

    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: Optional[_boolean]
    BrokerId: _string
    Configuration: Optional[ConfigurationId]
    EngineVersion: Optional[_string]
    HostInstanceType: Optional[_string]
    LdapServerMetadata: Optional[LdapServerMetadataInput]
    Logs: Optional[Logs]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    SecurityGroups: Optional[_listOf__string]
    DataReplicationMode: Optional[DataReplicationMode]


class UpdateBrokerResponse(TypedDict, total=False):
    AuthenticationStrategy: Optional[AuthenticationStrategy]
    AutoMinorVersionUpgrade: Optional[_boolean]
    BrokerId: Optional[_string]
    Configuration: Optional[ConfigurationId]
    EngineVersion: Optional[_string]
    HostInstanceType: Optional[_string]
    LdapServerMetadata: Optional[LdapServerMetadataOutput]
    Logs: Optional[Logs]
    MaintenanceWindowStartTime: Optional[WeeklyStartTime]
    SecurityGroups: Optional[_listOf__string]
    DataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    DataReplicationMode: Optional[DataReplicationMode]
    PendingDataReplicationMetadata: Optional[DataReplicationMetadataOutput]
    PendingDataReplicationMode: Optional[DataReplicationMode]


class UpdateConfigurationInput(TypedDict, total=False):
    """Updates the specified configuration."""

    Data: _string
    Description: Optional[_string]


_listOfSanitizationWarning = List[SanitizationWarning]


class UpdateConfigurationOutput(TypedDict, total=False):
    """Returns information about the updated configuration."""

    Arn: _string
    Created: _timestampIso8601
    Id: _string
    LatestRevision: Optional[ConfigurationRevision]
    Name: _string
    Warnings: Optional[_listOfSanitizationWarning]


class UpdateConfigurationRequest(ServiceRequest):
    """Updates the specified configuration."""

    ConfigurationId: _string
    Data: _string
    Description: Optional[_string]


class UpdateConfigurationResponse(TypedDict, total=False):
    Arn: Optional[_string]
    Created: Optional[_timestampIso8601]
    Id: Optional[_string]
    LatestRevision: Optional[ConfigurationRevision]
    Name: Optional[_string]
    Warnings: Optional[_listOfSanitizationWarning]


class UpdateUserInput(TypedDict, total=False):
    """Updates the information for an ActiveMQ user."""

    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    Password: Optional[_string]
    ReplicationUser: Optional[_boolean]


class UpdateUserRequest(ServiceRequest):
    """Updates the information for an ActiveMQ user."""

    BrokerId: _string
    ConsoleAccess: Optional[_boolean]
    Groups: Optional[_listOf__string]
    Password: Optional[_string]
    Username: _string
    ReplicationUser: Optional[_boolean]


class UpdateUserResponse(TypedDict, total=False):
    pass


_long = int
_timestampUnix = datetime


class MqApi:
    service = "mq"
    version = "2017-11-27"

    @handler("CreateBroker")
    def create_broker(
        self,
        context: RequestContext,
        engine_version: _string,
        host_instance_type: _string,
        auto_minor_version_upgrade: _boolean,
        users: _listOfUser,
        broker_name: _string,
        deployment_mode: DeploymentMode,
        engine_type: EngineType,
        publicly_accessible: _boolean,
        authentication_strategy: AuthenticationStrategy = None,
        configuration: ConfigurationId = None,
        creator_request_id: _string = None,
        encryption_options: EncryptionOptions = None,
        ldap_server_metadata: LdapServerMetadataInput = None,
        logs: Logs = None,
        maintenance_window_start_time: WeeklyStartTime = None,
        security_groups: _listOf__string = None,
        storage_type: BrokerStorageType = None,
        subnet_ids: _listOf__string = None,
        tags: _mapOf__string = None,
        data_replication_mode: DataReplicationMode = None,
        data_replication_primary_broker_arn: _string = None,
    ) -> CreateBrokerResponse:
        """Creates a broker. Note: This API is asynchronous.

        To create a broker, you must either use the AmazonMQFullAccess IAM
        policy or include the following EC2 permissions in your IAM policy.

        -  ec2:CreateNetworkInterface

           This permission is required to allow Amazon MQ to create an elastic
           network interface (ENI) on behalf of your account.

        -  ec2:CreateNetworkInterfacePermission

           This permission is required to attach the ENI to the broker instance.

        -  ec2:DeleteNetworkInterface

        -  ec2:DeleteNetworkInterfacePermission

        -  ec2:DetachNetworkInterface

        -  ec2:DescribeInternetGateways

        -  ec2:DescribeNetworkInterfaces

        -  ec2:DescribeNetworkInterfacePermissions

        -  ec2:DescribeRouteTables

        -  ec2:DescribeSecurityGroups

        -  ec2:DescribeSubnets

        -  ec2:DescribeVpcs

        For more information, see `Create an IAM User and Get Your Amazon Web
        Services
        Credentials <https://docs.aws.amazon.com//amazon-mq/latest/developer-guide/amazon-mq-setting-up.html#create-iam-user>`__
        and `Never Modify or Delete the Amazon MQ Elastic Network
        Interface <https://docs.aws.amazon.com//amazon-mq/latest/developer-guide/connecting-to-amazon-mq.html#never-modify-delete-elastic-network-interface>`__
        in the *Amazon MQ Developer Guide*.

        :param engine_version: Required.
        :param host_instance_type: Required.
        :param auto_minor_version_upgrade: Enables automatic upgrades to new minor versions for brokers, as new
        versions are released and supported by Amazon MQ.
        :param users: The list of broker users (persons or applications) who can access queues
        and topics.
        :param broker_name: Required.
        :param deployment_mode: Required.
        :param engine_type: Required.
        :param publicly_accessible: Enables connections from applications outside of the VPC that hosts the
        broker's subnets.
        :param authentication_strategy: Optional.
        :param configuration: A list of information about the configuration.
        :param creator_request_id: The unique ID that the requester receives for the created broker.
        :param encryption_options: Encryption options for the broker.
        :param ldap_server_metadata: Optional.
        :param logs: Enables Amazon CloudWatch logging for brokers.
        :param maintenance_window_start_time: The parameters that determine the WeeklyStartTime.
        :param security_groups: The list of rules (1 minimum, 125 maximum) that authorize connections to
        brokers.
        :param storage_type: The broker's storage type.
        :param subnet_ids: The list of groups that define which subnets and IP ranges the broker
        can use from different Availability Zones.
        :param tags: Create tags when creating the broker.
        :param data_replication_mode: Defines whether this broker is a part of a data replication pair.
        :param data_replication_primary_broker_arn: The Amazon Resource Name (ARN) of the primary broker that is used to
        replicate data from in a data replication pair, and is applied to the
        replica broker.
        :returns: CreateBrokerResponse
        :raises BadRequestException:
        :raises UnauthorizedException:
        :raises InternalServerErrorException:
        :raises ConflictException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("CreateConfiguration")
    def create_configuration(
        self,
        context: RequestContext,
        engine_version: _string,
        engine_type: EngineType,
        name: _string,
        authentication_strategy: AuthenticationStrategy = None,
        tags: _mapOf__string = None,
    ) -> CreateConfigurationResponse:
        """Creates a new configuration for the specified configuration name. Amazon
        MQ uses the default configuration (the engine type and version).

        :param engine_version: Required.
        :param engine_type: Required.
        :param name: Required.
        :param authentication_strategy: Optional.
        :param tags: Create tags when creating the configuration.
        :returns: CreateConfigurationResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ConflictException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("CreateTags")
    def create_tags(
        self, context: RequestContext, resource_arn: _string, tags: _mapOf__string = None
    ) -> None:
        """Add a tag to a resource.

        :param resource_arn: The Amazon Resource Name (ARN) of the resource tag.
        :param tags: The key-value pair for the resource tag.
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("CreateUser")
    def create_user(
        self,
        context: RequestContext,
        username: _string,
        broker_id: _string,
        password: _string,
        console_access: _boolean = None,
        groups: _listOf__string = None,
        replication_user: _boolean = None,
    ) -> CreateUserResponse:
        """Creates an ActiveMQ user.

        Do not add personally identifiable information (PII) or other
        confidential or sensitive information in broker usernames. Broker
        usernames are accessible to other Amazon Web Services services,
        including CloudWatch Logs. Broker usernames are not intended to be used
        for private or sensitive data.

        :param username: The username of the ActiveMQ user.
        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :param password: Required.
        :param console_access: Enables access to the ActiveMQ Web Console for the ActiveMQ user.
        :param groups: The list of groups (20 maximum) to which the ActiveMQ user belongs.
        :param replication_user: Defines if this user is intended for CRDR replication purposes.
        :returns: CreateUserResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ConflictException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DeleteBroker")
    def delete_broker(self, context: RequestContext, broker_id: _string) -> DeleteBrokerResponse:
        """Deletes a broker. Note: This API is asynchronous.

        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :returns: DeleteBrokerResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DeleteTags")
    def delete_tags(
        self, context: RequestContext, tag_keys: _listOf__string, resource_arn: _string
    ) -> None:
        """Removes a tag from a resource.

        :param tag_keys: An array of tag keys to delete.
        :param resource_arn: The Amazon Resource Name (ARN) of the resource tag.
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DeleteUser")
    def delete_user(
        self, context: RequestContext, username: _string, broker_id: _string
    ) -> DeleteUserResponse:
        """Deletes an ActiveMQ user.

        :param username: The username of the ActiveMQ user.
        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :returns: DeleteUserResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeBroker")
    def describe_broker(
        self, context: RequestContext, broker_id: _string
    ) -> DescribeBrokerResponse:
        """Returns information about the specified broker.

        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :returns: DescribeBrokerResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeBrokerEngineTypes")
    def describe_broker_engine_types(
        self,
        context: RequestContext,
        engine_type: _string = None,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> DescribeBrokerEngineTypesResponse:
        """Describe available engine types and versions.

        :param engine_type: Filter response by engine type.
        :param max_results: The maximum number of brokers that Amazon MQ can return per page (20 by
        default).
        :param next_token: The token that specifies the next page of results Amazon MQ should
        return.
        :returns: DescribeBrokerEngineTypesResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeBrokerInstanceOptions")
    def describe_broker_instance_options(
        self,
        context: RequestContext,
        engine_type: _string = None,
        host_instance_type: _string = None,
        max_results: MaxResults = None,
        next_token: _string = None,
        storage_type: _string = None,
    ) -> DescribeBrokerInstanceOptionsResponse:
        """Describe available broker instance options.

        :param engine_type: Filter response by engine type.
        :param host_instance_type: Filter response by host instance type.
        :param max_results: The maximum number of brokers that Amazon MQ can return per page (20 by
        default).
        :param next_token: The token that specifies the next page of results Amazon MQ should
        return.
        :param storage_type: Filter response by storage type.
        :returns: DescribeBrokerInstanceOptionsResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeConfiguration")
    def describe_configuration(
        self, context: RequestContext, configuration_id: _string
    ) -> DescribeConfigurationResponse:
        """Returns information about the specified configuration.

        :param configuration_id: The unique ID that Amazon MQ generates for the configuration.
        :returns: DescribeConfigurationResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeConfigurationRevision")
    def describe_configuration_revision(
        self, context: RequestContext, configuration_revision: _string, configuration_id: _string
    ) -> DescribeConfigurationRevisionResponse:
        """Returns the specified configuration revision for the specified
        configuration.

        :param configuration_revision: The revision of the configuration.
        :param configuration_id: The unique ID that Amazon MQ generates for the configuration.
        :returns: DescribeConfigurationRevisionResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("DescribeUser")
    def describe_user(
        self, context: RequestContext, username: _string, broker_id: _string
    ) -> DescribeUserResponse:
        """Returns information about an ActiveMQ user.

        :param username: The username of the ActiveMQ user.
        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :returns: DescribeUserResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListBrokers")
    def list_brokers(
        self, context: RequestContext, max_results: MaxResults = None, next_token: _string = None
    ) -> ListBrokersResponse:
        """Returns a list of all brokers.

        :param max_results: The maximum number of brokers that Amazon MQ can return per page (20 by
        default).
        :param next_token: The token that specifies the next page of results Amazon MQ should
        return.
        :returns: ListBrokersResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListConfigurationRevisions")
    def list_configuration_revisions(
        self,
        context: RequestContext,
        configuration_id: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListConfigurationRevisionsResponse:
        """Returns a list of all revisions for the specified configuration.

        :param configuration_id: The unique ID that Amazon MQ generates for the configuration.
        :param max_results: The maximum number of brokers that Amazon MQ can return per page (20 by
        default).
        :param next_token: The token that specifies the next page of results Amazon MQ should
        return.
        :returns: ListConfigurationRevisionsResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListConfigurations")
    def list_configurations(
        self, context: RequestContext, max_results: MaxResults = None, next_token: _string = None
    ) -> ListConfigurationsResponse:
        """Returns a list of all configurations.

        :param max_results: The maximum number of brokers that Amazon MQ can return per page (20 by
        default).
        :param next_token: The token that specifies the next page of results Amazon MQ should
        return.
        :returns: ListConfigurationsResponse
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListTags")
    def list_tags(self, context: RequestContext, resource_arn: _string) -> ListTagsResponse:
        """Lists tags for a resource.

        :param resource_arn: The Amazon Resource Name (ARN) of the resource tag.
        :returns: ListTagsResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("ListUsers")
    def list_users(
        self,
        context: RequestContext,
        broker_id: _string,
        max_results: MaxResults = None,
        next_token: _string = None,
    ) -> ListUsersResponse:
        """Returns a list of all ActiveMQ users.

        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :param max_results: The maximum number of brokers that Amazon MQ can return per page (20 by
        default).
        :param next_token: The token that specifies the next page of results Amazon MQ should
        return.
        :returns: ListUsersResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("Promote")
    def promote(
        self, context: RequestContext, broker_id: _string, mode: PromoteMode
    ) -> PromoteResponse:
        """Promotes a data replication replica broker to the primary broker role.

        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :param mode: The Promote mode requested.
        :returns: PromoteResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("RebootBroker")
    def reboot_broker(self, context: RequestContext, broker_id: _string) -> RebootBrokerResponse:
        """Reboots a broker. Note: This API is asynchronous.

        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :returns: RebootBrokerResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("UpdateBroker")
    def update_broker(
        self,
        context: RequestContext,
        broker_id: _string,
        authentication_strategy: AuthenticationStrategy = None,
        auto_minor_version_upgrade: _boolean = None,
        configuration: ConfigurationId = None,
        engine_version: _string = None,
        host_instance_type: _string = None,
        ldap_server_metadata: LdapServerMetadataInput = None,
        logs: Logs = None,
        maintenance_window_start_time: WeeklyStartTime = None,
        security_groups: _listOf__string = None,
        data_replication_mode: DataReplicationMode = None,
    ) -> UpdateBrokerResponse:
        """Adds a pending configuration change to a broker.

        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :param authentication_strategy: Optional.
        :param auto_minor_version_upgrade: Enables automatic upgrades to new minor versions for brokers, as new
        versions are released and supported by Amazon MQ.
        :param configuration: A list of information about the configuration.
        :param engine_version: The broker engine version.
        :param host_instance_type: The broker's host instance type to upgrade to.
        :param ldap_server_metadata: Optional.
        :param logs: Enables Amazon CloudWatch logging for brokers.
        :param maintenance_window_start_time: The parameters that determine the WeeklyStartTime.
        :param security_groups: The list of security groups (1 minimum, 5 maximum) that authorizes
        connections to brokers.
        :param data_replication_mode: Defines whether this broker is a part of a data replication pair.
        :returns: UpdateBrokerResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ConflictException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("UpdateConfiguration")
    def update_configuration(
        self,
        context: RequestContext,
        configuration_id: _string,
        data: _string,
        description: _string = None,
    ) -> UpdateConfigurationResponse:
        """Updates the specified configuration.

        :param configuration_id: The unique ID that Amazon MQ generates for the configuration.
        :param data: Amazon MQ for Active MQ: The base64-encoded XML configuration.
        :param description: The description of the configuration.
        :returns: UpdateConfigurationResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ConflictException:
        :raises ForbiddenException:
        """
        raise NotImplementedError

    @handler("UpdateUser")
    def update_user(
        self,
        context: RequestContext,
        username: _string,
        broker_id: _string,
        console_access: _boolean = None,
        groups: _listOf__string = None,
        password: _string = None,
        replication_user: _boolean = None,
    ) -> UpdateUserResponse:
        """Updates the information for an ActiveMQ user.

        :param username: The username of the ActiveMQ user.
        :param broker_id: The unique ID that Amazon MQ generates for the broker.
        :param console_access: Enables access to the the ActiveMQ Web Console for the ActiveMQ user.
        :param groups: The list of groups (20 maximum) to which the ActiveMQ user belongs.
        :param password: The password of the user.
        :param replication_user: Defines whether the user is intended for data replication.
        :returns: UpdateUserResponse
        :raises NotFoundException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ConflictException:
        :raises ForbiddenException:
        """
        raise NotImplementedError
