from datetime import datetime
from typing import IO, Dict, Iterable, List, Optional, TypedDict, Union

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

Arn = str
Boolean = bool
ConfigurationProfileType = str
DeploymentStrategyId = str
Description = str
ExtensionOrParameterName = str
Float = float
GrowthFactor = float
Id = str
Identifier = str
Integer = int
KmsKeyIdentifier = str
KmsKeyIdentifierOrEmpty = str
LongName = str
MaxResults = int
MinutesBetween0And24Hours = int
Name = str
NextToken = str
Percentage = float
QueryName = str
RoleArn = str
String = str
StringWithLengthBetween0And32768 = str
StringWithLengthBetween1And2048 = str
StringWithLengthBetween1And255 = str
StringWithLengthBetween1And64 = str
TagKey = str
TagValue = str
Uri = str
Version = str
VersionLabel = str


class ActionPoint(str):
    PRE_CREATE_HOSTED_CONFIGURATION_VERSION = "PRE_CREATE_HOSTED_CONFIGURATION_VERSION"
    PRE_START_DEPLOYMENT = "PRE_START_DEPLOYMENT"
    ON_DEPLOYMENT_START = "ON_DEPLOYMENT_START"
    ON_DEPLOYMENT_STEP = "ON_DEPLOYMENT_STEP"
    ON_DEPLOYMENT_BAKING = "ON_DEPLOYMENT_BAKING"
    ON_DEPLOYMENT_COMPLETE = "ON_DEPLOYMENT_COMPLETE"
    ON_DEPLOYMENT_ROLLED_BACK = "ON_DEPLOYMENT_ROLLED_BACK"


class BadRequestReason(str):
    InvalidConfiguration = "InvalidConfiguration"


class BytesMeasure(str):
    KILOBYTES = "KILOBYTES"


class DeploymentEventType(str):
    PERCENTAGE_UPDATED = "PERCENTAGE_UPDATED"
    ROLLBACK_STARTED = "ROLLBACK_STARTED"
    ROLLBACK_COMPLETED = "ROLLBACK_COMPLETED"
    BAKE_TIME_STARTED = "BAKE_TIME_STARTED"
    DEPLOYMENT_STARTED = "DEPLOYMENT_STARTED"
    DEPLOYMENT_COMPLETED = "DEPLOYMENT_COMPLETED"


class DeploymentState(str):
    BAKING = "BAKING"
    VALIDATING = "VALIDATING"
    DEPLOYING = "DEPLOYING"
    COMPLETE = "COMPLETE"
    ROLLING_BACK = "ROLLING_BACK"
    ROLLED_BACK = "ROLLED_BACK"


class EnvironmentState(str):
    READY_FOR_DEPLOYMENT = "READY_FOR_DEPLOYMENT"
    DEPLOYING = "DEPLOYING"
    ROLLING_BACK = "ROLLING_BACK"
    ROLLED_BACK = "ROLLED_BACK"


class GrowthType(str):
    LINEAR = "LINEAR"
    EXPONENTIAL = "EXPONENTIAL"


class ReplicateTo(str):
    NONE = "NONE"
    SSM_DOCUMENT = "SSM_DOCUMENT"


class TriggeredBy(str):
    USER = "USER"
    APPCONFIG = "APPCONFIG"
    CLOUDWATCH_ALARM = "CLOUDWATCH_ALARM"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ValidatorType(str):
    JSON_SCHEMA = "JSON_SCHEMA"
    LAMBDA = "LAMBDA"


class InvalidConfigurationDetail(TypedDict, total=False):
    """Detailed information about the bad request exception error when creating
    a hosted configuration version.
    """

    Constraint: Optional[String]
    Location: Optional[String]
    Reason: Optional[String]
    Type: Optional[String]
    Value: Optional[String]


InvalidConfigurationDetailList = List[InvalidConfigurationDetail]


class BadRequestDetails(TypedDict, total=False):
    """Detailed information about the input that failed to satisfy the
    constraints specified by a call.
    """

    InvalidConfiguration: Optional[InvalidConfigurationDetailList]


class BadRequestException(ServiceException):
    """The input fails to satisfy the constraints specified by an Amazon Web
    Services service.
    """

    code: str = "BadRequestException"
    sender_fault: bool = False
    status_code: int = 400
    Reason: Optional[BadRequestReason]
    Details: Optional[BadRequestDetails]


class ConflictException(ServiceException):
    """The request could not be processed because of conflict in the current
    state of the resource.
    """

    code: str = "ConflictException"
    sender_fault: bool = False
    status_code: int = 409


class InternalServerException(ServiceException):
    """There was an internal failure in the AppConfig service."""

    code: str = "InternalServerException"
    sender_fault: bool = False
    status_code: int = 500


class PayloadTooLargeException(ServiceException):
    """The configuration size is too large."""

    code: str = "PayloadTooLargeException"
    sender_fault: bool = False
    status_code: int = 413
    Measure: Optional[BytesMeasure]
    Limit: Optional[Float]
    Size: Optional[Float]


class ResourceNotFoundException(ServiceException):
    """The requested resource could not be found."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 404
    ResourceName: Optional[String]


class ServiceQuotaExceededException(ServiceException):
    """The number of one more AppConfig resources exceeds the maximum allowed.
    Verify that your environment doesn't exceed the following service
    quotas:

    Applications: 100 max

    Deployment strategies: 20 max

    Configuration profiles: 100 max per application

    Environments: 20 max per application

    To resolve this issue, you can delete one or more resources and try
    again. Or, you can request a quota increase. For more information about
    quotas and to request an increase, see `Service quotas for
    AppConfig <https://docs.aws.amazon.com/general/latest/gr/appconfig.html#limits_appconfig>`__
    in the Amazon Web Services General Reference.
    """

    code: str = "ServiceQuotaExceededException"
    sender_fault: bool = False
    status_code: int = 402


class Action(TypedDict, total=False):
    """An action defines the tasks that the extension performs during the
    AppConfig workflow. Each action includes an action point such as
    ``ON_CREATE_HOSTED_CONFIGURATION``, ``PRE_DEPLOYMENT``, or
    ``ON_DEPLOYMENT``. Each action also includes a name, a URI to an Lambda
    function, and an Amazon Resource Name (ARN) for an Identity and Access
    Management assume role. You specify the name, URI, and ARN for each
    *action point* defined in the extension. You can specify the following
    actions for an extension:

    -  ``PRE_CREATE_HOSTED_CONFIGURATION_VERSION``

    -  ``PRE_START_DEPLOYMENT``

    -  ``ON_DEPLOYMENT_START``

    -  ``ON_DEPLOYMENT_STEP``

    -  ``ON_DEPLOYMENT_BAKING``

    -  ``ON_DEPLOYMENT_COMPLETE``

    -  ``ON_DEPLOYMENT_ROLLED_BACK``
    """

    Name: Optional[Name]
    Description: Optional[Description]
    Uri: Optional[Uri]
    RoleArn: Optional[Arn]


class ActionInvocation(TypedDict, total=False):
    """An extension that was invoked as part of a deployment event."""

    ExtensionIdentifier: Optional[Identifier]
    ActionName: Optional[Name]
    Uri: Optional[Uri]
    RoleArn: Optional[Arn]
    ErrorMessage: Optional[String]
    ErrorCode: Optional[String]
    InvocationId: Optional[Id]


ActionInvocations = List[ActionInvocation]
ActionList = List[Action]
ActionsMap = Dict[ActionPoint, ActionList]


class Application(TypedDict, total=False):
    Id: Optional[Id]
    Name: Optional[Name]
    Description: Optional[Description]


ApplicationList = List[Application]


class Applications(TypedDict, total=False):
    Items: Optional[ApplicationList]
    NextToken: Optional[NextToken]


ParameterValueMap = Dict[ExtensionOrParameterName, StringWithLengthBetween1And2048]


class AppliedExtension(TypedDict, total=False):
    """An extension that was invoked during a deployment."""

    ExtensionId: Optional[Id]
    ExtensionAssociationId: Optional[Id]
    VersionNumber: Optional[Integer]
    Parameters: Optional[ParameterValueMap]


AppliedExtensions = List[AppliedExtension]
Blob = bytes


class Configuration(TypedDict, total=False):
    Content: Optional[Union[Blob, IO[Blob], Iterable[Blob]]]
    ConfigurationVersion: Optional[Version]
    ContentType: Optional[String]


class Validator(TypedDict, total=False):
    """A validator provides a syntactic or semantic check to ensure the
    configuration that you want to deploy functions as intended. To validate
    your application configuration data, you provide a schema or an Amazon
    Web Services Lambda function that runs against the configuration. The
    configuration deployment or update can only proceed when the
    configuration data is valid.
    """

    Type: ValidatorType
    Content: StringWithLengthBetween0And32768


ValidatorList = List[Validator]


class ConfigurationProfile(TypedDict, total=False):
    ApplicationId: Optional[Id]
    Id: Optional[Id]
    Name: Optional[LongName]
    Description: Optional[Description]
    LocationUri: Optional[Uri]
    RetrievalRoleArn: Optional[RoleArn]
    Validators: Optional[ValidatorList]
    Type: Optional[ConfigurationProfileType]
    KmsKeyArn: Optional[Arn]
    KmsKeyIdentifier: Optional[KmsKeyIdentifier]


ValidatorTypeList = List[ValidatorType]


class ConfigurationProfileSummary(TypedDict, total=False):
    """A summary of a configuration profile."""

    ApplicationId: Optional[Id]
    Id: Optional[Id]
    Name: Optional[LongName]
    LocationUri: Optional[Uri]
    ValidatorTypes: Optional[ValidatorTypeList]
    Type: Optional[ConfigurationProfileType]


ConfigurationProfileSummaryList = List[ConfigurationProfileSummary]


class ConfigurationProfiles(TypedDict, total=False):
    Items: Optional[ConfigurationProfileSummaryList]
    NextToken: Optional[NextToken]


TagMap = Dict[TagKey, TagValue]


class CreateApplicationRequest(ServiceRequest):
    Name: Name
    Description: Optional[Description]
    Tags: Optional[TagMap]


class CreateConfigurationProfileRequest(ServiceRequest):
    ApplicationId: Id
    Name: LongName
    Description: Optional[Description]
    LocationUri: Uri
    RetrievalRoleArn: Optional[RoleArn]
    Validators: Optional[ValidatorList]
    Tags: Optional[TagMap]
    Type: Optional[ConfigurationProfileType]
    KmsKeyIdentifier: Optional[KmsKeyIdentifier]


class CreateDeploymentStrategyRequest(ServiceRequest):
    Name: Name
    Description: Optional[Description]
    DeploymentDurationInMinutes: MinutesBetween0And24Hours
    FinalBakeTimeInMinutes: Optional[MinutesBetween0And24Hours]
    GrowthFactor: GrowthFactor
    GrowthType: Optional[GrowthType]
    ReplicateTo: Optional[ReplicateTo]
    Tags: Optional[TagMap]


class Monitor(TypedDict, total=False):
    """Amazon CloudWatch alarms to monitor during the deployment process."""

    AlarmArn: StringWithLengthBetween1And2048
    AlarmRoleArn: Optional[RoleArn]


MonitorList = List[Monitor]


class CreateEnvironmentRequest(ServiceRequest):
    ApplicationId: Id
    Name: Name
    Description: Optional[Description]
    Monitors: Optional[MonitorList]
    Tags: Optional[TagMap]


class CreateExtensionAssociationRequest(ServiceRequest):
    ExtensionIdentifier: Identifier
    ExtensionVersionNumber: Optional[Integer]
    ResourceIdentifier: Identifier
    Parameters: Optional[ParameterValueMap]
    Tags: Optional[TagMap]


class Parameter(TypedDict, total=False):
    """A value such as an Amazon Resource Name (ARN) or an Amazon Simple
    Notification Service topic entered in an extension when invoked.
    Parameter values are specified in an extension association. For more
    information about extensions, see `Working with AppConfig
    extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
    in the *AppConfig User Guide*.
    """

    Description: Optional[Description]
    Required: Optional[Boolean]


ParameterMap = Dict[ExtensionOrParameterName, Parameter]


class CreateExtensionRequest(ServiceRequest):
    Name: ExtensionOrParameterName
    Description: Optional[Description]
    Actions: ActionsMap
    Parameters: Optional[ParameterMap]
    Tags: Optional[TagMap]
    LatestVersionNumber: Optional[Integer]


class CreateHostedConfigurationVersionRequest(ServiceRequest):
    Content: IO[Blob]
    ApplicationId: Id
    ConfigurationProfileId: Id
    Description: Optional[Description]
    ContentType: StringWithLengthBetween1And255
    LatestVersionNumber: Optional[Integer]
    VersionLabel: Optional[VersionLabel]


class DeleteApplicationRequest(ServiceRequest):
    ApplicationId: Id


class DeleteConfigurationProfileRequest(ServiceRequest):
    ApplicationId: Id
    ConfigurationProfileId: Id


class DeleteDeploymentStrategyRequest(ServiceRequest):
    DeploymentStrategyId: DeploymentStrategyId


class DeleteEnvironmentRequest(ServiceRequest):
    ApplicationId: Id
    EnvironmentId: Id


class DeleteExtensionAssociationRequest(ServiceRequest):
    ExtensionAssociationId: Id


class DeleteExtensionRequest(ServiceRequest):
    ExtensionIdentifier: Identifier
    VersionNumber: Optional[Integer]


class DeleteHostedConfigurationVersionRequest(ServiceRequest):
    ApplicationId: Id
    ConfigurationProfileId: Id
    VersionNumber: Integer


Iso8601DateTime = datetime


class DeploymentEvent(TypedDict, total=False):
    """An object that describes a deployment event."""

    EventType: Optional[DeploymentEventType]
    TriggeredBy: Optional[TriggeredBy]
    Description: Optional[Description]
    ActionInvocations: Optional[ActionInvocations]
    OccurredAt: Optional[Iso8601DateTime]


DeploymentEvents = List[DeploymentEvent]


class Deployment(TypedDict, total=False):
    ApplicationId: Optional[Id]
    EnvironmentId: Optional[Id]
    DeploymentStrategyId: Optional[Id]
    ConfigurationProfileId: Optional[Id]
    DeploymentNumber: Optional[Integer]
    ConfigurationName: Optional[Name]
    ConfigurationLocationUri: Optional[Uri]
    ConfigurationVersion: Optional[Version]
    Description: Optional[Description]
    DeploymentDurationInMinutes: Optional[MinutesBetween0And24Hours]
    GrowthType: Optional[GrowthType]
    GrowthFactor: Optional[Percentage]
    FinalBakeTimeInMinutes: Optional[MinutesBetween0And24Hours]
    State: Optional[DeploymentState]
    EventLog: Optional[DeploymentEvents]
    PercentageComplete: Optional[Percentage]
    StartedAt: Optional[Iso8601DateTime]
    CompletedAt: Optional[Iso8601DateTime]
    AppliedExtensions: Optional[AppliedExtensions]
    KmsKeyArn: Optional[Arn]
    KmsKeyIdentifier: Optional[KmsKeyIdentifier]
    VersionLabel: Optional[VersionLabel]


class DeploymentSummary(TypedDict, total=False):
    """Information about the deployment."""

    DeploymentNumber: Optional[Integer]
    ConfigurationName: Optional[Name]
    ConfigurationVersion: Optional[Version]
    DeploymentDurationInMinutes: Optional[MinutesBetween0And24Hours]
    GrowthType: Optional[GrowthType]
    GrowthFactor: Optional[Percentage]
    FinalBakeTimeInMinutes: Optional[MinutesBetween0And24Hours]
    State: Optional[DeploymentState]
    PercentageComplete: Optional[Percentage]
    StartedAt: Optional[Iso8601DateTime]
    CompletedAt: Optional[Iso8601DateTime]
    VersionLabel: Optional[VersionLabel]


DeploymentList = List[DeploymentSummary]


class DeploymentStrategy(TypedDict, total=False):
    Id: Optional[Id]
    Name: Optional[Name]
    Description: Optional[Description]
    DeploymentDurationInMinutes: Optional[MinutesBetween0And24Hours]
    GrowthType: Optional[GrowthType]
    GrowthFactor: Optional[Percentage]
    FinalBakeTimeInMinutes: Optional[MinutesBetween0And24Hours]
    ReplicateTo: Optional[ReplicateTo]


DeploymentStrategyList = List[DeploymentStrategy]


class DeploymentStrategies(TypedDict, total=False):
    Items: Optional[DeploymentStrategyList]
    NextToken: Optional[NextToken]


class Deployments(TypedDict, total=False):
    Items: Optional[DeploymentList]
    NextToken: Optional[NextToken]


class Environment(TypedDict, total=False):
    ApplicationId: Optional[Id]
    Id: Optional[Id]
    Name: Optional[Name]
    Description: Optional[Description]
    State: Optional[EnvironmentState]
    Monitors: Optional[MonitorList]


EnvironmentList = List[Environment]


class Environments(TypedDict, total=False):
    Items: Optional[EnvironmentList]
    NextToken: Optional[NextToken]


class Extension(TypedDict, total=False):
    Id: Optional[Id]
    Name: Optional[Name]
    VersionNumber: Optional[Integer]
    Arn: Optional[Arn]
    Description: Optional[Description]
    Actions: Optional[ActionsMap]
    Parameters: Optional[ParameterMap]


class ExtensionAssociation(TypedDict, total=False):
    Id: Optional[Identifier]
    ExtensionArn: Optional[Arn]
    ResourceArn: Optional[Arn]
    Arn: Optional[Arn]
    Parameters: Optional[ParameterValueMap]
    ExtensionVersionNumber: Optional[Integer]


class ExtensionAssociationSummary(TypedDict, total=False):
    """Information about an association between an extension and an AppConfig
    resource such as an application, environment, or configuration profile.
    Call ``GetExtensionAssociation`` to get more information about an
    association.
    """

    Id: Optional[Identifier]
    ExtensionArn: Optional[Arn]
    ResourceArn: Optional[Arn]


ExtensionAssociationSummaries = List[ExtensionAssociationSummary]


class ExtensionAssociations(TypedDict, total=False):
    Items: Optional[ExtensionAssociationSummaries]
    NextToken: Optional[NextToken]


class ExtensionSummary(TypedDict, total=False):
    """Information about an extension. Call ``GetExtension`` to get more
    information about an extension.
    """

    Id: Optional[Id]
    Name: Optional[Name]
    VersionNumber: Optional[Integer]
    Arn: Optional[Arn]
    Description: Optional[Description]


ExtensionSummaries = List[ExtensionSummary]


class Extensions(TypedDict, total=False):
    Items: Optional[ExtensionSummaries]
    NextToken: Optional[NextToken]


class GetApplicationRequest(ServiceRequest):
    ApplicationId: Id


class GetConfigurationProfileRequest(ServiceRequest):
    ApplicationId: Id
    ConfigurationProfileId: Id


class GetConfigurationRequest(ServiceRequest):
    Application: StringWithLengthBetween1And64
    Environment: StringWithLengthBetween1And64
    Configuration: StringWithLengthBetween1And64
    ClientId: StringWithLengthBetween1And64
    ClientConfigurationVersion: Optional[Version]


class GetDeploymentRequest(ServiceRequest):
    ApplicationId: Id
    EnvironmentId: Id
    DeploymentNumber: Integer


class GetDeploymentStrategyRequest(ServiceRequest):
    DeploymentStrategyId: DeploymentStrategyId


class GetEnvironmentRequest(ServiceRequest):
    ApplicationId: Id
    EnvironmentId: Id


class GetExtensionAssociationRequest(ServiceRequest):
    ExtensionAssociationId: Id


class GetExtensionRequest(ServiceRequest):
    ExtensionIdentifier: Identifier
    VersionNumber: Optional[Integer]


class GetHostedConfigurationVersionRequest(ServiceRequest):
    ApplicationId: Id
    ConfigurationProfileId: Id
    VersionNumber: Integer


class HostedConfigurationVersion(TypedDict, total=False):
    Content: Optional[Union[Blob, IO[Blob], Iterable[Blob]]]
    ApplicationId: Optional[Id]
    ConfigurationProfileId: Optional[Id]
    VersionNumber: Optional[Integer]
    Description: Optional[Description]
    ContentType: Optional[StringWithLengthBetween1And255]
    VersionLabel: Optional[VersionLabel]
    KmsKeyArn: Optional[Arn]


class HostedConfigurationVersionSummary(TypedDict, total=False):
    """Information about the configuration."""

    ApplicationId: Optional[Id]
    ConfigurationProfileId: Optional[Id]
    VersionNumber: Optional[Integer]
    Description: Optional[Description]
    ContentType: Optional[StringWithLengthBetween1And255]
    VersionLabel: Optional[VersionLabel]
    KmsKeyArn: Optional[Arn]


HostedConfigurationVersionSummaryList = List[HostedConfigurationVersionSummary]


class HostedConfigurationVersions(TypedDict, total=False):
    Items: Optional[HostedConfigurationVersionSummaryList]
    NextToken: Optional[NextToken]


class ListApplicationsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class ListConfigurationProfilesRequest(ServiceRequest):
    ApplicationId: Id
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]
    Type: Optional[ConfigurationProfileType]


class ListDeploymentStrategiesRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class ListDeploymentsRequest(ServiceRequest):
    ApplicationId: Id
    EnvironmentId: Id
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class ListEnvironmentsRequest(ServiceRequest):
    ApplicationId: Id
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class ListExtensionAssociationsRequest(ServiceRequest):
    ResourceIdentifier: Optional[Arn]
    ExtensionIdentifier: Optional[Identifier]
    ExtensionVersionNumber: Optional[Integer]
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class ListExtensionsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]
    Name: Optional[QueryName]


class ListHostedConfigurationVersionsRequest(ServiceRequest):
    ApplicationId: Id
    ConfigurationProfileId: Id
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]
    VersionLabel: Optional[QueryName]


class ListTagsForResourceRequest(ServiceRequest):
    ResourceArn: Arn


class ResourceTags(TypedDict, total=False):
    Tags: Optional[TagMap]


class StartDeploymentRequest(ServiceRequest):
    ApplicationId: Id
    EnvironmentId: Id
    DeploymentStrategyId: DeploymentStrategyId
    ConfigurationProfileId: Id
    ConfigurationVersion: Version
    Description: Optional[Description]
    Tags: Optional[TagMap]
    KmsKeyIdentifier: Optional[KmsKeyIdentifier]


class StopDeploymentRequest(ServiceRequest):
    ApplicationId: Id
    EnvironmentId: Id
    DeploymentNumber: Integer


TagKeyList = List[TagKey]


class TagResourceRequest(ServiceRequest):
    ResourceArn: Arn
    Tags: TagMap


class UntagResourceRequest(ServiceRequest):
    ResourceArn: Arn
    TagKeys: TagKeyList


class UpdateApplicationRequest(ServiceRequest):
    ApplicationId: Id
    Name: Optional[Name]
    Description: Optional[Description]


class UpdateConfigurationProfileRequest(ServiceRequest):
    ApplicationId: Id
    ConfigurationProfileId: Id
    Name: Optional[Name]
    Description: Optional[Description]
    RetrievalRoleArn: Optional[RoleArn]
    Validators: Optional[ValidatorList]
    KmsKeyIdentifier: Optional[KmsKeyIdentifierOrEmpty]


class UpdateDeploymentStrategyRequest(ServiceRequest):
    DeploymentStrategyId: DeploymentStrategyId
    Description: Optional[Description]
    DeploymentDurationInMinutes: Optional[MinutesBetween0And24Hours]
    FinalBakeTimeInMinutes: Optional[MinutesBetween0And24Hours]
    GrowthFactor: Optional[GrowthFactor]
    GrowthType: Optional[GrowthType]


class UpdateEnvironmentRequest(ServiceRequest):
    ApplicationId: Id
    EnvironmentId: Id
    Name: Optional[Name]
    Description: Optional[Description]
    Monitors: Optional[MonitorList]


class UpdateExtensionAssociationRequest(ServiceRequest):
    ExtensionAssociationId: Id
    Parameters: Optional[ParameterValueMap]


class UpdateExtensionRequest(ServiceRequest):
    ExtensionIdentifier: Identifier
    Description: Optional[Description]
    Actions: Optional[ActionsMap]
    Parameters: Optional[ParameterMap]
    VersionNumber: Optional[Integer]


class ValidateConfigurationRequest(ServiceRequest):
    ApplicationId: Id
    ConfigurationProfileId: Id
    ConfigurationVersion: Version


class AppconfigApi:
    service = "appconfig"
    version = "2019-10-09"

    @handler("CreateApplication")
    def create_application(
        self,
        context: RequestContext,
        name: Name,
        description: Description = None,
        tags: TagMap = None,
    ) -> Application:
        """Creates an application. In AppConfig, an application is simply an
        organizational construct like a folder. This organizational construct
        has a relationship with some unit of executable code. For example, you
        could create an application called MyMobileApp to organize and manage
        configuration data for a mobile application installed by your users.

        :param name: A name for the application.
        :param description: A description of the application.
        :param tags: Metadata to assign to the application.
        :returns: Application
        :raises BadRequestException:
        :raises ServiceQuotaExceededException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("CreateConfigurationProfile", expand=False)
    def create_configuration_profile(
        self, context: RequestContext, request: CreateConfigurationProfileRequest
    ) -> ConfigurationProfile:
        """Creates a configuration profile, which is information that enables
        AppConfig to access the configuration source. Valid configuration
        sources include the following:

        -  Configuration data in YAML, JSON, and other formats stored in the
           AppConfig hosted configuration store

        -  Configuration data stored as objects in an Amazon Simple Storage
           Service (Amazon S3) bucket

        -  Pipelines stored in CodePipeline

        -  Secrets stored in Secrets Manager

        -  Standard and secure string parameters stored in Amazon Web Services
           Systems Manager Parameter Store

        -  Configuration data in SSM documents stored in the Systems Manager
           document store

        A configuration profile includes the following information:

        -  The URI location of the configuration data.

        -  The Identity and Access Management (IAM) role that provides access to
           the configuration data.

        -  A validator for the configuration data. Available validators include
           either a JSON Schema or an Amazon Web Services Lambda function.

        For more information, see `Create a Configuration and a Configuration
        Profile <http://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile.html>`__
        in the *AppConfig User Guide*.

        :param application_id: The application ID.
        :param name: A name for the configuration profile.
        :param location_uri: A URI to locate the configuration.
        :param description: A description of the configuration profile.
        :param retrieval_role_arn: The ARN of an IAM role with permission to access the configuration at
        the specified ``LocationUri``.
        :param validators: A list of methods for validating the configuration.
        :param tags: Metadata to assign to the configuration profile.
        :param type: The type of configurations contained in the profile.
        :param kms_key_identifier: The identifier for an Key Management Service key to encrypt new
        configuration data versions in the AppConfig hosted configuration store.
        :returns: ConfigurationProfile
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ServiceQuotaExceededException:
        """
        raise NotImplementedError

    @handler("CreateDeploymentStrategy")
    def create_deployment_strategy(
        self,
        context: RequestContext,
        name: Name,
        deployment_duration_in_minutes: MinutesBetween0And24Hours,
        growth_factor: GrowthFactor,
        description: Description = None,
        final_bake_time_in_minutes: MinutesBetween0And24Hours = None,
        growth_type: GrowthType = None,
        replicate_to: ReplicateTo = None,
        tags: TagMap = None,
    ) -> DeploymentStrategy:
        """Creates a deployment strategy that defines important criteria for
        rolling out your configuration to the designated targets. A deployment
        strategy includes the overall duration required, a percentage of targets
        to receive the deployment during each interval, an algorithm that
        defines how percentage grows, and bake time.

        :param name: A name for the deployment strategy.
        :param deployment_duration_in_minutes: Total amount of time for a deployment to last.
        :param growth_factor: The percentage of targets to receive a deployed configuration during
        each interval.
        :param description: A description of the deployment strategy.
        :param final_bake_time_in_minutes: Specifies the amount of time AppConfig monitors for Amazon CloudWatch
        alarms after the configuration has been deployed to 100% of its targets,
        before considering the deployment to be complete.
        :param growth_type: The algorithm used to define how percentage grows over time.
        :param replicate_to: Save the deployment strategy to a Systems Manager (SSM) document.
        :param tags: Metadata to assign to the deployment strategy.
        :returns: DeploymentStrategy
        :raises InternalServerException:
        :raises ServiceQuotaExceededException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("CreateEnvironment")
    def create_environment(
        self,
        context: RequestContext,
        application_id: Id,
        name: Name,
        description: Description = None,
        monitors: MonitorList = None,
        tags: TagMap = None,
    ) -> Environment:
        """Creates an environment. For each application, you define one or more
        environments. An environment is a deployment group of AppConfig targets,
        such as applications in a ``Beta`` or ``Production`` environment. You
        can also define environments for application subcomponents such as the
        ``Web``, ``Mobile`` and ``Back-end`` components for your application.
        You can configure Amazon CloudWatch alarms for each environment. The
        system monitors alarms during a configuration deployment. If an alarm is
        triggered, the system rolls back the configuration.

        :param application_id: The application ID.
        :param name: A name for the environment.
        :param description: A description of the environment.
        :param monitors: Amazon CloudWatch alarms to monitor during the deployment process.
        :param tags: Metadata to assign to the environment.
        :returns: Environment
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises BadRequestException:
        :raises ServiceQuotaExceededException:
        """
        raise NotImplementedError

    @handler("CreateExtension")
    def create_extension(
        self,
        context: RequestContext,
        name: ExtensionOrParameterName,
        actions: ActionsMap,
        description: Description = None,
        parameters: ParameterMap = None,
        tags: TagMap = None,
        latest_version_number: Integer = None,
    ) -> Extension:
        """Creates an AppConfig extension. An extension augments your ability to
        inject logic or behavior at different points during the AppConfig
        workflow of creating or deploying a configuration.

        You can create your own extensions or use the Amazon Web Services
        authored extensions provided by AppConfig. For an AppConfig extension
        that uses Lambda, you must create a Lambda function to perform any
        computation and processing defined in the extension. If you plan to
        create custom versions of the Amazon Web Services authored notification
        extensions, you only need to specify an Amazon Resource Name (ARN) in
        the ``Uri`` field for the new extension version.

        -  For a custom EventBridge notification extension, enter the ARN of the
           EventBridge default events in the ``Uri`` field.

        -  For a custom Amazon SNS notification extension, enter the ARN of an
           Amazon SNS topic in the ``Uri`` field.

        -  For a custom Amazon SQS notification extension, enter the ARN of an
           Amazon SQS message queue in the ``Uri`` field.

        For more information about extensions, see `Working with AppConfig
        extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
        in the *AppConfig User Guide*.

        :param name: A name for the extension.
        :param actions: The actions defined in the extension.
        :param description: Information about the extension.
        :param parameters: The parameters accepted by the extension.
        :param tags: Adds one or more tags for the specified extension.
        :param latest_version_number: You can omit this field when you create an extension.
        :returns: Extension
        :raises BadRequestException:
        :raises ConflictException:
        :raises ServiceQuotaExceededException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("CreateExtensionAssociation")
    def create_extension_association(
        self,
        context: RequestContext,
        extension_identifier: Identifier,
        resource_identifier: Identifier,
        extension_version_number: Integer = None,
        parameters: ParameterValueMap = None,
        tags: TagMap = None,
    ) -> ExtensionAssociation:
        """When you create an extension or configure an Amazon Web Services
        authored extension, you associate the extension with an AppConfig
        application, environment, or configuration profile. For example, you can
        choose to run the ``AppConfig deployment events to Amazon SNS`` Amazon
        Web Services authored extension and receive notifications on an Amazon
        SNS topic anytime a configuration deployment is started for a specific
        application. Defining which extension to associate with an AppConfig
        resource is called an *extension association*. An extension association
        is a specified relationship between an extension and an AppConfig
        resource, such as an application or a configuration profile. For more
        information about extensions and associations, see `Working with
        AppConfig
        extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
        in the *AppConfig User Guide*.

        :param extension_identifier: The name, the ID, or the Amazon Resource Name (ARN) of the extension.
        :param resource_identifier: The ARN of an application, configuration profile, or environment.
        :param extension_version_number: The version number of the extension.
        :param parameters: The parameter names and values defined in the extensions.
        :param tags: Adds one or more tags for the specified extension association.
        :returns: ExtensionAssociation
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ServiceQuotaExceededException:
        """
        raise NotImplementedError

    @handler("CreateHostedConfigurationVersion")
    def create_hosted_configuration_version(
        self,
        context: RequestContext,
        application_id: Id,
        configuration_profile_id: Id,
        content: IO[Blob],
        content_type: StringWithLengthBetween1And255,
        description: Description = None,
        latest_version_number: Integer = None,
        version_label: VersionLabel = None,
    ) -> HostedConfigurationVersion:
        """Creates a new configuration in the AppConfig hosted configuration store.

        :param application_id: The application ID.
        :param configuration_profile_id: The configuration profile ID.
        :param content: The content of the configuration or the configuration data.
        :param content_type: A standard MIME type describing the format of the configuration content.
        :param description: A description of the configuration.
        :param latest_version_number: An optional locking token used to prevent race conditions from
        overwriting configuration updates when creating a new version.
        :param version_label: An optional, user-defined label for the AppConfig hosted configuration
        version.
        :returns: HostedConfigurationVersion
        :raises BadRequestException:
        :raises ServiceQuotaExceededException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises PayloadTooLargeException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DeleteApplication")
    def delete_application(self, context: RequestContext, application_id: Id) -> None:
        """Deletes an application. Deleting an application does not delete a
        configuration from a host.

        :param application_id: The ID of the application to delete.
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("DeleteConfigurationProfile")
    def delete_configuration_profile(
        self, context: RequestContext, application_id: Id, configuration_profile_id: Id
    ) -> None:
        """Deletes a configuration profile. Deleting a configuration profile does
        not delete a configuration from a host.

        :param application_id: The application ID that includes the configuration profile you want to
        delete.
        :param configuration_profile_id: The ID of the configuration profile you want to delete.
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("DeleteDeploymentStrategy")
    def delete_deployment_strategy(
        self, context: RequestContext, deployment_strategy_id: DeploymentStrategyId
    ) -> None:
        """Deletes a deployment strategy. Deleting a deployment strategy does not
        delete a configuration from a host.

        :param deployment_strategy_id: The ID of the deployment strategy you want to delete.
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("DeleteEnvironment")
    def delete_environment(
        self, context: RequestContext, application_id: Id, environment_id: Id
    ) -> None:
        """Deletes an environment. Deleting an environment does not delete a
        configuration from a host.

        :param application_id: The application ID that includes the environment that you want to
        delete.
        :param environment_id: The ID of the environment that you want to delete.
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("DeleteExtension")
    def delete_extension(
        self,
        context: RequestContext,
        extension_identifier: Identifier,
        version_number: Integer = None,
    ) -> None:
        """Deletes an AppConfig extension. You must delete all associations to an
        extension before you delete the extension.

        :param extension_identifier: The name, ID, or Amazon Resource Name (ARN) of the extension you want to
        delete.
        :param version_number: A specific version of an extension to delete.
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("DeleteExtensionAssociation")
    def delete_extension_association(
        self, context: RequestContext, extension_association_id: Id
    ) -> None:
        """Deletes an extension association. This action doesn't delete extensions
        defined in the association.

        :param extension_association_id: The ID of the extension association to delete.
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DeleteHostedConfigurationVersion")
    def delete_hosted_configuration_version(
        self,
        context: RequestContext,
        application_id: Id,
        configuration_profile_id: Id,
        version_number: Integer,
    ) -> None:
        """Deletes a version of a configuration from the AppConfig hosted
        configuration store.

        :param application_id: The application ID.
        :param configuration_profile_id: The configuration profile ID.
        :param version_number: The versions number to delete.
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetApplication")
    def get_application(self, context: RequestContext, application_id: Id) -> Application:
        """Retrieves information about an application.

        :param application_id: The ID of the application you want to get.
        :returns: Application
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("GetConfiguration")
    def get_configuration(
        self,
        context: RequestContext,
        application: StringWithLengthBetween1And64,
        environment: StringWithLengthBetween1And64,
        configuration: StringWithLengthBetween1And64,
        client_id: StringWithLengthBetween1And64,
        client_configuration_version: Version = None,
    ) -> Configuration:
        """(Deprecated) Retrieves the latest deployed configuration.

        Note the following important information.

        -  This API action is deprecated. Calls to receive configuration data
           should use the
           `StartConfigurationSession <https://docs.aws.amazon.com/appconfig/2019-10-09/APIReference/API_appconfigdata_StartConfigurationSession.html>`__
           and
           `GetLatestConfiguration <https://docs.aws.amazon.com/appconfig/2019-10-09/APIReference/API_appconfigdata_GetLatestConfiguration.html>`__
           APIs instead.

        -  ``GetConfiguration`` is a priced call. For more information, see
           `Pricing <https://aws.amazon.com/systems-manager/pricing/>`__.

        :param application: The application to get.
        :param environment: The environment to get.
        :param configuration: The configuration to get.
        :param client_id: The clientId parameter in the following command is a unique,
        user-specified ID to identify the client for the configuration.
        :param client_configuration_version: The configuration version returned in the most recent
        ``GetConfiguration`` response.
        :returns: Configuration
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("GetConfigurationProfile")
    def get_configuration_profile(
        self, context: RequestContext, application_id: Id, configuration_profile_id: Id
    ) -> ConfigurationProfile:
        """Retrieves information about a configuration profile.

        :param application_id: The ID of the application that includes the configuration profile you
        want to get.
        :param configuration_profile_id: The ID of the configuration profile that you want to get.
        :returns: ConfigurationProfile
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("GetDeployment")
    def get_deployment(
        self,
        context: RequestContext,
        application_id: Id,
        environment_id: Id,
        deployment_number: Integer,
    ) -> Deployment:
        """Retrieves information about a configuration deployment.

        :param application_id: The ID of the application that includes the deployment you want to get.
        :param environment_id: The ID of the environment that includes the deployment you want to get.
        :param deployment_number: The sequence number of the deployment.
        :returns: Deployment
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("GetDeploymentStrategy")
    def get_deployment_strategy(
        self, context: RequestContext, deployment_strategy_id: DeploymentStrategyId
    ) -> DeploymentStrategy:
        """Retrieves information about a deployment strategy. A deployment strategy
        defines important criteria for rolling out your configuration to the
        designated targets. A deployment strategy includes the overall duration
        required, a percentage of targets to receive the deployment during each
        interval, an algorithm that defines how percentage grows, and bake time.

        :param deployment_strategy_id: The ID of the deployment strategy to get.
        :returns: DeploymentStrategy
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("GetEnvironment")
    def get_environment(
        self, context: RequestContext, application_id: Id, environment_id: Id
    ) -> Environment:
        """Retrieves information about an environment. An environment is a
        deployment group of AppConfig applications, such as applications in a
        ``Production`` environment or in an ``EU_Region`` environment. Each
        configuration deployment targets an environment. You can enable one or
        more Amazon CloudWatch alarms for an environment. If an alarm is
        triggered during a deployment, AppConfig roles back the configuration.

        :param application_id: The ID of the application that includes the environment you want to get.
        :param environment_id: The ID of the environment that you want to get.
        :returns: Environment
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("GetExtension")
    def get_extension(
        self,
        context: RequestContext,
        extension_identifier: Identifier,
        version_number: Integer = None,
    ) -> Extension:
        """Returns information about an AppConfig extension.

        :param extension_identifier: The name, the ID, or the Amazon Resource Name (ARN) of the extension.
        :param version_number: The extension version number.
        :returns: Extension
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("GetExtensionAssociation")
    def get_extension_association(
        self, context: RequestContext, extension_association_id: Id
    ) -> ExtensionAssociation:
        """Returns information about an AppConfig extension association. For more
        information about extensions and associations, see `Working with
        AppConfig
        extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
        in the *AppConfig User Guide*.

        :param extension_association_id: The extension association ID to get.
        :returns: ExtensionAssociation
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetHostedConfigurationVersion")
    def get_hosted_configuration_version(
        self,
        context: RequestContext,
        application_id: Id,
        configuration_profile_id: Id,
        version_number: Integer,
    ) -> HostedConfigurationVersion:
        """Retrieves information about a specific configuration version.

        :param application_id: The application ID.
        :param configuration_profile_id: The configuration profile ID.
        :param version_number: The version.
        :returns: HostedConfigurationVersion
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("ListApplications")
    def list_applications(
        self, context: RequestContext, max_results: MaxResults = None, next_token: NextToken = None
    ) -> Applications:
        """Lists all applications in your Amazon Web Services account.

        :param max_results: The maximum number of items to return for this call.
        :param next_token: A token to start the list.
        :returns: Applications
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("ListConfigurationProfiles", expand=False)
    def list_configuration_profiles(
        self, context: RequestContext, request: ListConfigurationProfilesRequest
    ) -> ConfigurationProfiles:
        """Lists the configuration profiles for an application.

        :param application_id: The application ID.
        :param max_results: The maximum number of items to return for this call.
        :param next_token: A token to start the list.
        :param type: A filter based on the type of configurations that the configuration
        profile contains.
        :returns: ConfigurationProfiles
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("ListDeploymentStrategies")
    def list_deployment_strategies(
        self, context: RequestContext, max_results: MaxResults = None, next_token: NextToken = None
    ) -> DeploymentStrategies:
        """Lists deployment strategies.

        :param max_results: The maximum number of items to return for this call.
        :param next_token: A token to start the list.
        :returns: DeploymentStrategies
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("ListDeployments")
    def list_deployments(
        self,
        context: RequestContext,
        application_id: Id,
        environment_id: Id,
        max_results: MaxResults = None,
        next_token: NextToken = None,
    ) -> Deployments:
        """Lists the deployments for an environment in descending deployment number
        order.

        :param application_id: The application ID.
        :param environment_id: The environment ID.
        :param max_results: The maximum number of items that may be returned for this call.
        :param next_token: The token returned by a prior call to this operation indicating the next
        set of results to be returned.
        :returns: Deployments
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("ListEnvironments")
    def list_environments(
        self,
        context: RequestContext,
        application_id: Id,
        max_results: MaxResults = None,
        next_token: NextToken = None,
    ) -> Environments:
        """Lists the environments for an application.

        :param application_id: The application ID.
        :param max_results: The maximum number of items to return for this call.
        :param next_token: A token to start the list.
        :returns: Environments
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("ListExtensionAssociations")
    def list_extension_associations(
        self,
        context: RequestContext,
        resource_identifier: Arn = None,
        extension_identifier: Identifier = None,
        extension_version_number: Integer = None,
        max_results: MaxResults = None,
        next_token: NextToken = None,
    ) -> ExtensionAssociations:
        """Lists all AppConfig extension associations in the account. For more
        information about extensions and associations, see `Working with
        AppConfig
        extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
        in the *AppConfig User Guide*.

        :param resource_identifier: The ARN of an application, configuration profile, or environment.
        :param extension_identifier: The name, the ID, or the Amazon Resource Name (ARN) of the extension.
        :param extension_version_number: The version number for the extension defined in the association.
        :param max_results: The maximum number of items to return for this call.
        :param next_token: A token to start the list.
        :returns: ExtensionAssociations
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("ListExtensions")
    def list_extensions(
        self,
        context: RequestContext,
        max_results: MaxResults = None,
        next_token: NextToken = None,
        name: QueryName = None,
    ) -> Extensions:
        """Lists all custom and Amazon Web Services authored AppConfig extensions
        in the account. For more information about extensions, see `Working with
        AppConfig
        extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
        in the *AppConfig User Guide*.

        :param max_results: The maximum number of items to return for this call.
        :param next_token: A token to start the list.
        :param name: The extension name.
        :returns: Extensions
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("ListHostedConfigurationVersions")
    def list_hosted_configuration_versions(
        self,
        context: RequestContext,
        application_id: Id,
        configuration_profile_id: Id,
        max_results: MaxResults = None,
        next_token: NextToken = None,
        version_label: QueryName = None,
    ) -> HostedConfigurationVersions:
        """Lists configurations stored in the AppConfig hosted configuration store
        by version.

        :param application_id: The application ID.
        :param configuration_profile_id: The configuration profile ID.
        :param max_results: The maximum number of items to return for this call.
        :param next_token: A token to start the list.
        :param version_label: An optional filter that can be used to specify the version label of an
        AppConfig hosted configuration version.
        :returns: HostedConfigurationVersions
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(self, context: RequestContext, resource_arn: Arn) -> ResourceTags:
        """Retrieves the list of key-value tags assigned to the resource.

        :param resource_arn: The resource ARN.
        :returns: ResourceTags
        :raises ResourceNotFoundException:
        :raises BadRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("StartDeployment")
    def start_deployment(
        self,
        context: RequestContext,
        application_id: Id,
        environment_id: Id,
        deployment_strategy_id: DeploymentStrategyId,
        configuration_profile_id: Id,
        configuration_version: Version,
        description: Description = None,
        tags: TagMap = None,
        kms_key_identifier: KmsKeyIdentifier = None,
    ) -> Deployment:
        """Starts a deployment.

        :param application_id: The application ID.
        :param environment_id: The environment ID.
        :param deployment_strategy_id: The deployment strategy ID.
        :param configuration_profile_id: The configuration profile ID.
        :param configuration_version: The configuration version to deploy.
        :param description: A description of the deployment.
        :param tags: Metadata to assign to the deployment.
        :param kms_key_identifier: The KMS key identifier (key ID, key alias, or key ARN).
        :returns: Deployment
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("StopDeployment")
    def stop_deployment(
        self,
        context: RequestContext,
        application_id: Id,
        environment_id: Id,
        deployment_number: Integer,
    ) -> Deployment:
        """Stops a deployment. This API action works only on deployments that have
        a status of ``DEPLOYING``. This action moves the deployment to a status
        of ``ROLLED_BACK``.

        :param application_id: The application ID.
        :param environment_id: The environment ID.
        :param deployment_number: The sequence number of the deployment.
        :returns: Deployment
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises BadRequestException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(self, context: RequestContext, resource_arn: Arn, tags: TagMap) -> None:
        """Assigns metadata to an AppConfig resource. Tags help organize and
        categorize your AppConfig resources. Each tag consists of a key and an
        optional value, both of which you define. You can specify a maximum of
        50 tags for a resource.

        :param resource_arn: The ARN of the resource for which to retrieve tags.
        :param tags: The key-value string map.
        :raises ResourceNotFoundException:
        :raises BadRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UntagResource")
    def untag_resource(
        self, context: RequestContext, resource_arn: Arn, tag_keys: TagKeyList
    ) -> None:
        """Deletes a tag key and value from an AppConfig resource.

        :param resource_arn: The ARN of the resource for which to remove tags.
        :param tag_keys: The tag keys to delete.
        :raises ResourceNotFoundException:
        :raises BadRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateApplication")
    def update_application(
        self,
        context: RequestContext,
        application_id: Id,
        name: Name = None,
        description: Description = None,
    ) -> Application:
        """Updates an application.

        :param application_id: The application ID.
        :param name: The name of the application.
        :param description: A description of the application.
        :returns: Application
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateConfigurationProfile")
    def update_configuration_profile(
        self,
        context: RequestContext,
        application_id: Id,
        configuration_profile_id: Id,
        name: Name = None,
        description: Description = None,
        retrieval_role_arn: RoleArn = None,
        validators: ValidatorList = None,
        kms_key_identifier: KmsKeyIdentifierOrEmpty = None,
    ) -> ConfigurationProfile:
        """Updates a configuration profile.

        :param application_id: The application ID.
        :param configuration_profile_id: The ID of the configuration profile.
        :param name: The name of the configuration profile.
        :param description: A description of the configuration profile.
        :param retrieval_role_arn: The ARN of an IAM role with permission to access the configuration at
        the specified ``LocationUri``.
        :param validators: A list of methods for validating the configuration.
        :param kms_key_identifier: The identifier for a Key Management Service key to encrypt new
        configuration data versions in the AppConfig hosted configuration store.
        :returns: ConfigurationProfile
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateDeploymentStrategy")
    def update_deployment_strategy(
        self,
        context: RequestContext,
        deployment_strategy_id: DeploymentStrategyId,
        description: Description = None,
        deployment_duration_in_minutes: MinutesBetween0And24Hours = None,
        final_bake_time_in_minutes: MinutesBetween0And24Hours = None,
        growth_factor: GrowthFactor = None,
        growth_type: GrowthType = None,
    ) -> DeploymentStrategy:
        """Updates a deployment strategy.

        :param deployment_strategy_id: The deployment strategy ID.
        :param description: A description of the deployment strategy.
        :param deployment_duration_in_minutes: Total amount of time for a deployment to last.
        :param final_bake_time_in_minutes: The amount of time that AppConfig monitors for alarms before considering
        the deployment to be complete and no longer eligible for automatic
        rollback.
        :param growth_factor: The percentage of targets to receive a deployed configuration during
        each interval.
        :param growth_type: The algorithm used to define how percentage grows over time.
        :returns: DeploymentStrategy
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateEnvironment")
    def update_environment(
        self,
        context: RequestContext,
        application_id: Id,
        environment_id: Id,
        name: Name = None,
        description: Description = None,
        monitors: MonitorList = None,
    ) -> Environment:
        """Updates an environment.

        :param application_id: The application ID.
        :param environment_id: The environment ID.
        :param name: The name of the environment.
        :param description: A description of the environment.
        :param monitors: Amazon CloudWatch alarms to monitor during the deployment process.
        :returns: Environment
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateExtension")
    def update_extension(
        self,
        context: RequestContext,
        extension_identifier: Identifier,
        description: Description = None,
        actions: ActionsMap = None,
        parameters: ParameterMap = None,
        version_number: Integer = None,
    ) -> Extension:
        """Updates an AppConfig extension. For more information about extensions,
        see `Working with AppConfig
        extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
        in the *AppConfig User Guide*.

        :param extension_identifier: The name, the ID, or the Amazon Resource Name (ARN) of the extension.
        :param description: Information about the extension.
        :param actions: The actions defined in the extension.
        :param parameters: One or more parameters for the actions called by the extension.
        :param version_number: The extension version number.
        :returns: Extension
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateExtensionAssociation")
    def update_extension_association(
        self,
        context: RequestContext,
        extension_association_id: Id,
        parameters: ParameterValueMap = None,
    ) -> ExtensionAssociation:
        """Updates an association. For more information about extensions and
        associations, see `Working with AppConfig
        extensions <https://docs.aws.amazon.com/appconfig/latest/userguide/working-with-appconfig-extensions.html>`__
        in the *AppConfig User Guide*.

        :param extension_association_id: The system-generated ID for the association.
        :param parameters: The parameter names and values defined in the extension.
        :returns: ExtensionAssociation
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("ValidateConfiguration")
    def validate_configuration(
        self,
        context: RequestContext,
        application_id: Id,
        configuration_profile_id: Id,
        configuration_version: Version,
    ) -> None:
        """Uses the validators in a configuration profile to validate a
        configuration.

        :param application_id: The application ID.
        :param configuration_profile_id: The configuration profile ID.
        :param configuration_version: The version of the configuration to validate.
        :raises BadRequestException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError
