from datetime import datetime
from typing import Dict, List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

ActionDescription = str
ActionId = str
ActionParameterDescription = str
ActionParameterName = str
ActionParameterRequired = bool
ActionTargetName = str
ClientToken = str
CloudWatchLogGroupArn = str
ExceptionMessage = str
ExperimentActionDescription = str
ExperimentActionName = str
ExperimentActionParameter = str
ExperimentActionParameterName = str
ExperimentActionStartAfter = str
ExperimentActionStatusReason = str
ExperimentActionTargetName = str
ExperimentId = str
ExperimentStatusReason = str
ExperimentTargetFilterPath = str
ExperimentTargetFilterValue = str
ExperimentTargetName = str
ExperimentTargetParameterName = str
ExperimentTargetParameterValue = str
ExperimentTargetSelectionMode = str
ExperimentTemplateActionDescription = str
ExperimentTemplateActionName = str
ExperimentTemplateActionParameter = str
ExperimentTemplateActionParameterName = str
ExperimentTemplateActionStartAfter = str
ExperimentTemplateActionTargetName = str
ExperimentTemplateDescription = str
ExperimentTemplateId = str
ExperimentTemplateTargetFilterPath = str
ExperimentTemplateTargetFilterValue = str
ExperimentTemplateTargetName = str
ExperimentTemplateTargetParameterName = str
ExperimentTemplateTargetParameterValue = str
ExperimentTemplateTargetSelectionMode = str
ListActionsMaxResults = int
ListExperimentTemplatesMaxResults = int
ListExperimentsMaxResults = int
ListTargetResourceTypesMaxResults = int
LogSchemaVersion = int
NextToken = str
ResourceArn = str
RoleArn = str
S3BucketName = str
S3ObjectKey = str
StopConditionSource = str
StopConditionValue = str
TagKey = str
TagValue = str
TargetResourceTypeDescription = str
TargetResourceTypeId = str
TargetResourceTypeParameterDescription = str
TargetResourceTypeParameterName = str
TargetResourceTypeParameterRequired = bool


class ExperimentActionStatus(str):
    pending = "pending"
    initiating = "initiating"
    running = "running"
    completed = "completed"
    cancelled = "cancelled"
    stopping = "stopping"
    stopped = "stopped"
    failed = "failed"


class ExperimentStatus(str):
    pending = "pending"
    initiating = "initiating"
    running = "running"
    completed = "completed"
    stopping = "stopping"
    stopped = "stopped"
    failed = "failed"


class ConflictException(ServiceException):
    """The request could not be processed because of a conflict."""

    code: str = "ConflictException"
    sender_fault: bool = False
    status_code: int = 409


class ResourceNotFoundException(ServiceException):
    """The specified resource cannot be found."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 404


class ServiceQuotaExceededException(ServiceException):
    """You have exceeded your service quota."""

    code: str = "ServiceQuotaExceededException"
    sender_fault: bool = False
    status_code: int = 402


class ValidationException(ServiceException):
    """The specified input is not valid, or fails to satisfy the constraints
    for the request.
    """

    code: str = "ValidationException"
    sender_fault: bool = False
    status_code: int = 400


TagMap = Dict[TagKey, TagValue]


class ActionTarget(TypedDict, total=False):
    """Describes a target for an action."""

    resourceType: Optional[TargetResourceTypeId]


ActionTargetMap = Dict[ActionTargetName, ActionTarget]


class ActionParameter(TypedDict, total=False):
    """Describes a parameter for an action."""

    description: Optional[ActionParameterDescription]
    required: Optional[ActionParameterRequired]


ActionParameterMap = Dict[ActionParameterName, ActionParameter]


class Action(TypedDict, total=False):
    """Describes an action. For more information, see `FIS
    actions <https://docs.aws.amazon.com/fis/latest/userguide/fis-actions-reference.html>`__
    in the *Fault Injection Simulator User Guide*.
    """

    id: Optional[ActionId]
    description: Optional[ActionDescription]
    parameters: Optional[ActionParameterMap]
    targets: Optional[ActionTargetMap]
    tags: Optional[TagMap]


class ActionSummary(TypedDict, total=False):
    """Provides a summary of an action."""

    id: Optional[ActionId]
    description: Optional[ActionDescription]
    targets: Optional[ActionTargetMap]
    tags: Optional[TagMap]


ActionSummaryList = List[ActionSummary]
ExperimentTemplateActionStartAfterList = List[ExperimentTemplateActionStartAfter]
ExperimentTemplateActionTargetMap = Dict[
    ExperimentTemplateActionTargetName, ExperimentTemplateTargetName
]
ExperimentTemplateActionParameterMap = Dict[
    ExperimentTemplateActionParameterName, ExperimentTemplateActionParameter
]


class CreateExperimentTemplateActionInput(TypedDict, total=False):
    """Specifies an action for an experiment template.

    For more information, see
    `Actions <https://docs.aws.amazon.com/fis/latest/userguide/actions.html>`__
    in the *Fault Injection Simulator User Guide*.
    """

    actionId: ActionId
    description: Optional[ExperimentTemplateActionDescription]
    parameters: Optional[ExperimentTemplateActionParameterMap]
    targets: Optional[ExperimentTemplateActionTargetMap]
    startAfter: Optional[ExperimentTemplateActionStartAfterList]


CreateExperimentTemplateActionInputMap = Dict[
    ExperimentTemplateActionName, CreateExperimentTemplateActionInput
]


class ExperimentTemplateS3LogConfigurationInput(TypedDict, total=False):
    """Specifies the configuration for experiment logging to Amazon S3."""

    bucketName: S3BucketName
    prefix: Optional[S3ObjectKey]


class ExperimentTemplateCloudWatchLogsLogConfigurationInput(TypedDict, total=False):
    """Specifies the configuration for experiment logging to Amazon CloudWatch
    Logs.
    """

    logGroupArn: CloudWatchLogGroupArn


class CreateExperimentTemplateLogConfigurationInput(TypedDict, total=False):
    """Specifies the configuration for experiment logging."""

    cloudWatchLogsConfiguration: Optional[ExperimentTemplateCloudWatchLogsLogConfigurationInput]
    s3Configuration: Optional[ExperimentTemplateS3LogConfigurationInput]
    logSchemaVersion: LogSchemaVersion


ExperimentTemplateTargetParameterMap = Dict[
    ExperimentTemplateTargetParameterName, ExperimentTemplateTargetParameterValue
]
ExperimentTemplateTargetFilterValues = List[ExperimentTemplateTargetFilterValue]


class ExperimentTemplateTargetInputFilter(TypedDict, total=False):
    """Specifies a filter used for the target resource input in an experiment
    template.

    For more information, see `Resource
    filters <https://docs.aws.amazon.com/fis/latest/userguide/targets.html#target-filters>`__
    in the *Fault Injection Simulator User Guide*.
    """

    path: ExperimentTemplateTargetFilterPath
    values: ExperimentTemplateTargetFilterValues


ExperimentTemplateTargetFilterInputList = List[ExperimentTemplateTargetInputFilter]
ResourceArnList = List[ResourceArn]


class CreateExperimentTemplateTargetInput(TypedDict, total=False):
    """Specifies a target for an experiment. You must specify at least one
    Amazon Resource Name (ARN) or at least one resource tag. You cannot
    specify both ARNs and tags.

    For more information, see
    `Targets <https://docs.aws.amazon.com/fis/latest/userguide/targets.html>`__
    in the *Fault Injection Simulator User Guide*.
    """

    resourceType: TargetResourceTypeId
    resourceArns: Optional[ResourceArnList]
    resourceTags: Optional[TagMap]
    filters: Optional[ExperimentTemplateTargetFilterInputList]
    selectionMode: ExperimentTemplateTargetSelectionMode
    parameters: Optional[ExperimentTemplateTargetParameterMap]


CreateExperimentTemplateTargetInputMap = Dict[
    ExperimentTemplateTargetName, CreateExperimentTemplateTargetInput
]


class CreateExperimentTemplateStopConditionInput(TypedDict, total=False):
    """Specifies a stop condition for an experiment template."""

    source: StopConditionSource
    value: Optional[StopConditionValue]


CreateExperimentTemplateStopConditionInputList = List[CreateExperimentTemplateStopConditionInput]


class CreateExperimentTemplateRequest(ServiceRequest):
    clientToken: ClientToken
    description: ExperimentTemplateDescription
    stopConditions: CreateExperimentTemplateStopConditionInputList
    targets: Optional[CreateExperimentTemplateTargetInputMap]
    actions: CreateExperimentTemplateActionInputMap
    roleArn: RoleArn
    tags: Optional[TagMap]
    logConfiguration: Optional[CreateExperimentTemplateLogConfigurationInput]


class ExperimentTemplateS3LogConfiguration(TypedDict, total=False):
    """Describes the configuration for experiment logging to Amazon S3."""

    bucketName: Optional[S3BucketName]
    prefix: Optional[S3ObjectKey]


class ExperimentTemplateCloudWatchLogsLogConfiguration(TypedDict, total=False):
    """Describes the configuration for experiment logging to Amazon CloudWatch
    Logs.
    """

    logGroupArn: Optional[CloudWatchLogGroupArn]


class ExperimentTemplateLogConfiguration(TypedDict, total=False):
    """Describes the configuration for experiment logging."""

    cloudWatchLogsConfiguration: Optional[ExperimentTemplateCloudWatchLogsLogConfiguration]
    s3Configuration: Optional[ExperimentTemplateS3LogConfiguration]
    logSchemaVersion: Optional[LogSchemaVersion]


LastUpdateTime = datetime
CreationTime = datetime


class ExperimentTemplateStopCondition(TypedDict, total=False):
    """Describes a stop condition for an experiment template."""

    source: Optional[StopConditionSource]
    value: Optional[StopConditionValue]


ExperimentTemplateStopConditionList = List[ExperimentTemplateStopCondition]


class ExperimentTemplateAction(TypedDict, total=False):
    """Describes an action for an experiment template."""

    actionId: Optional[ActionId]
    description: Optional[ExperimentTemplateActionDescription]
    parameters: Optional[ExperimentTemplateActionParameterMap]
    targets: Optional[ExperimentTemplateActionTargetMap]
    startAfter: Optional[ExperimentTemplateActionStartAfterList]


ExperimentTemplateActionMap = Dict[ExperimentTemplateActionName, ExperimentTemplateAction]


class ExperimentTemplateTargetFilter(TypedDict, total=False):
    """Describes a filter used for the target resources in an experiment
    template.
    """

    path: Optional[ExperimentTemplateTargetFilterPath]
    values: Optional[ExperimentTemplateTargetFilterValues]


ExperimentTemplateTargetFilterList = List[ExperimentTemplateTargetFilter]


class ExperimentTemplateTarget(TypedDict, total=False):
    """Describes a target for an experiment template."""

    resourceType: Optional[TargetResourceTypeId]
    resourceArns: Optional[ResourceArnList]
    resourceTags: Optional[TagMap]
    filters: Optional[ExperimentTemplateTargetFilterList]
    selectionMode: Optional[ExperimentTemplateTargetSelectionMode]
    parameters: Optional[ExperimentTemplateTargetParameterMap]


ExperimentTemplateTargetMap = Dict[ExperimentTemplateTargetName, ExperimentTemplateTarget]


class ExperimentTemplate(TypedDict, total=False):
    """Describes an experiment template."""

    id: Optional[ExperimentTemplateId]
    description: Optional[ExperimentTemplateDescription]
    targets: Optional[ExperimentTemplateTargetMap]
    actions: Optional[ExperimentTemplateActionMap]
    stopConditions: Optional[ExperimentTemplateStopConditionList]
    creationTime: Optional[CreationTime]
    lastUpdateTime: Optional[LastUpdateTime]
    roleArn: Optional[RoleArn]
    tags: Optional[TagMap]
    logConfiguration: Optional[ExperimentTemplateLogConfiguration]


class CreateExperimentTemplateResponse(TypedDict, total=False):
    experimentTemplate: Optional[ExperimentTemplate]


class DeleteExperimentTemplateRequest(ServiceRequest):
    id: ExperimentTemplateId


class DeleteExperimentTemplateResponse(TypedDict, total=False):
    experimentTemplate: Optional[ExperimentTemplate]


class ExperimentS3LogConfiguration(TypedDict, total=False):
    """Describes the configuration for experiment logging to Amazon S3."""

    bucketName: Optional[S3BucketName]
    prefix: Optional[S3ObjectKey]


class ExperimentCloudWatchLogsLogConfiguration(TypedDict, total=False):
    """Describes the configuration for experiment logging to Amazon CloudWatch
    Logs.
    """

    logGroupArn: Optional[CloudWatchLogGroupArn]


class ExperimentLogConfiguration(TypedDict, total=False):
    """Describes the configuration for experiment logging."""

    cloudWatchLogsConfiguration: Optional[ExperimentCloudWatchLogsLogConfiguration]
    s3Configuration: Optional[ExperimentS3LogConfiguration]
    logSchemaVersion: Optional[LogSchemaVersion]


ExperimentEndTime = datetime
ExperimentStartTime = datetime


class ExperimentStopCondition(TypedDict, total=False):
    """Describes the stop condition for an experiment."""

    source: Optional[StopConditionSource]
    value: Optional[StopConditionValue]


ExperimentStopConditionList = List[ExperimentStopCondition]
ExperimentActionEndTime = datetime
ExperimentActionStartTime = datetime


class ExperimentActionState(TypedDict, total=False):
    """Describes the state of an action."""

    status: Optional[ExperimentActionStatus]
    reason: Optional[ExperimentActionStatusReason]


ExperimentActionStartAfterList = List[ExperimentActionStartAfter]
ExperimentActionTargetMap = Dict[ExperimentActionTargetName, ExperimentTargetName]
ExperimentActionParameterMap = Dict[ExperimentActionParameterName, ExperimentActionParameter]


class ExperimentAction(TypedDict, total=False):
    """Describes the action for an experiment."""

    actionId: Optional[ActionId]
    description: Optional[ExperimentActionDescription]
    parameters: Optional[ExperimentActionParameterMap]
    targets: Optional[ExperimentActionTargetMap]
    startAfter: Optional[ExperimentActionStartAfterList]
    state: Optional[ExperimentActionState]
    startTime: Optional[ExperimentActionStartTime]
    endTime: Optional[ExperimentActionEndTime]


ExperimentActionMap = Dict[ExperimentActionName, ExperimentAction]
ExperimentTargetParameterMap = Dict[ExperimentTargetParameterName, ExperimentTargetParameterValue]
ExperimentTargetFilterValues = List[ExperimentTargetFilterValue]


class ExperimentTargetFilter(TypedDict, total=False):
    """Describes a filter used for the target resources in an experiment."""

    path: Optional[ExperimentTargetFilterPath]
    values: Optional[ExperimentTargetFilterValues]


ExperimentTargetFilterList = List[ExperimentTargetFilter]


class ExperimentTarget(TypedDict, total=False):
    """Describes a target for an experiment."""

    resourceType: Optional[TargetResourceTypeId]
    resourceArns: Optional[ResourceArnList]
    resourceTags: Optional[TagMap]
    filters: Optional[ExperimentTargetFilterList]
    selectionMode: Optional[ExperimentTargetSelectionMode]
    parameters: Optional[ExperimentTargetParameterMap]


ExperimentTargetMap = Dict[ExperimentTargetName, ExperimentTarget]


class ExperimentState(TypedDict, total=False):
    """Describes the state of an experiment."""

    status: Optional[ExperimentStatus]
    reason: Optional[ExperimentStatusReason]


class Experiment(TypedDict, total=False):
    """Describes an experiment."""

    id: Optional[ExperimentId]
    experimentTemplateId: Optional[ExperimentTemplateId]
    roleArn: Optional[RoleArn]
    state: Optional[ExperimentState]
    targets: Optional[ExperimentTargetMap]
    actions: Optional[ExperimentActionMap]
    stopConditions: Optional[ExperimentStopConditionList]
    creationTime: Optional[CreationTime]
    startTime: Optional[ExperimentStartTime]
    endTime: Optional[ExperimentEndTime]
    tags: Optional[TagMap]
    logConfiguration: Optional[ExperimentLogConfiguration]


class ExperimentSummary(TypedDict, total=False):
    """Provides a summary of an experiment."""

    id: Optional[ExperimentId]
    experimentTemplateId: Optional[ExperimentTemplateId]
    state: Optional[ExperimentState]
    creationTime: Optional[CreationTime]
    tags: Optional[TagMap]


ExperimentSummaryList = List[ExperimentSummary]


class ExperimentTemplateSummary(TypedDict, total=False):
    """Provides a summary of an experiment template."""

    id: Optional[ExperimentTemplateId]
    description: Optional[ExperimentTemplateDescription]
    creationTime: Optional[CreationTime]
    lastUpdateTime: Optional[LastUpdateTime]
    tags: Optional[TagMap]


ExperimentTemplateSummaryList = List[ExperimentTemplateSummary]


class GetActionRequest(ServiceRequest):
    id: ActionId


class GetActionResponse(TypedDict, total=False):
    action: Optional[Action]


class GetExperimentRequest(ServiceRequest):
    id: ExperimentId


class GetExperimentResponse(TypedDict, total=False):
    experiment: Optional[Experiment]


class GetExperimentTemplateRequest(ServiceRequest):
    id: ExperimentTemplateId


class GetExperimentTemplateResponse(TypedDict, total=False):
    experimentTemplate: Optional[ExperimentTemplate]


class GetTargetResourceTypeRequest(ServiceRequest):
    resourceType: TargetResourceTypeId


class TargetResourceTypeParameter(TypedDict, total=False):
    """Describes the parameters for a resource type. Use parameters to
    determine which tasks are identified during target resolution.
    """

    description: Optional[TargetResourceTypeParameterDescription]
    required: Optional[TargetResourceTypeParameterRequired]


TargetResourceTypeParameterMap = Dict[TargetResourceTypeParameterName, TargetResourceTypeParameter]


class TargetResourceType(TypedDict, total=False):
    """Describes a resource type."""

    resourceType: Optional[TargetResourceTypeId]
    description: Optional[TargetResourceTypeDescription]
    parameters: Optional[TargetResourceTypeParameterMap]


class GetTargetResourceTypeResponse(TypedDict, total=False):
    targetResourceType: Optional[TargetResourceType]


class ListActionsRequest(ServiceRequest):
    maxResults: Optional[ListActionsMaxResults]
    nextToken: Optional[NextToken]


class ListActionsResponse(TypedDict, total=False):
    actions: Optional[ActionSummaryList]
    nextToken: Optional[NextToken]


class ListExperimentTemplatesRequest(ServiceRequest):
    maxResults: Optional[ListExperimentTemplatesMaxResults]
    nextToken: Optional[NextToken]


class ListExperimentTemplatesResponse(TypedDict, total=False):
    experimentTemplates: Optional[ExperimentTemplateSummaryList]
    nextToken: Optional[NextToken]


class ListExperimentsRequest(ServiceRequest):
    maxResults: Optional[ListExperimentsMaxResults]
    nextToken: Optional[NextToken]


class ListExperimentsResponse(TypedDict, total=False):
    experiments: Optional[ExperimentSummaryList]
    nextToken: Optional[NextToken]


class ListTagsForResourceRequest(ServiceRequest):
    resourceArn: ResourceArn


class ListTagsForResourceResponse(TypedDict, total=False):
    tags: Optional[TagMap]


class ListTargetResourceTypesRequest(ServiceRequest):
    maxResults: Optional[ListTargetResourceTypesMaxResults]
    nextToken: Optional[NextToken]


class TargetResourceTypeSummary(TypedDict, total=False):
    """Describes a resource type."""

    resourceType: Optional[TargetResourceTypeId]
    description: Optional[TargetResourceTypeDescription]


TargetResourceTypeSummaryList = List[TargetResourceTypeSummary]


class ListTargetResourceTypesResponse(TypedDict, total=False):
    targetResourceTypes: Optional[TargetResourceTypeSummaryList]
    nextToken: Optional[NextToken]


class StartExperimentRequest(ServiceRequest):
    clientToken: ClientToken
    experimentTemplateId: ExperimentTemplateId
    tags: Optional[TagMap]


class StartExperimentResponse(TypedDict, total=False):
    experiment: Optional[Experiment]


class StopExperimentRequest(ServiceRequest):
    id: ExperimentId


class StopExperimentResponse(TypedDict, total=False):
    experiment: Optional[Experiment]


TagKeyList = List[TagKey]


class TagResourceRequest(ServiceRequest):
    resourceArn: ResourceArn
    tags: TagMap


class TagResourceResponse(TypedDict, total=False):
    pass


class UntagResourceRequest(ServiceRequest):
    resourceArn: ResourceArn
    tagKeys: Optional[TagKeyList]


class UntagResourceResponse(TypedDict, total=False):
    pass


class UpdateExperimentTemplateActionInputItem(TypedDict, total=False):
    """Specifies an action for an experiment template."""

    actionId: Optional[ActionId]
    description: Optional[ExperimentTemplateActionDescription]
    parameters: Optional[ExperimentTemplateActionParameterMap]
    targets: Optional[ExperimentTemplateActionTargetMap]
    startAfter: Optional[ExperimentTemplateActionStartAfterList]


UpdateExperimentTemplateActionInputMap = Dict[
    ExperimentTemplateActionName, UpdateExperimentTemplateActionInputItem
]


class UpdateExperimentTemplateLogConfigurationInput(TypedDict, total=False):
    """Specifies the configuration for experiment logging."""

    cloudWatchLogsConfiguration: Optional[ExperimentTemplateCloudWatchLogsLogConfigurationInput]
    s3Configuration: Optional[ExperimentTemplateS3LogConfigurationInput]
    logSchemaVersion: Optional[LogSchemaVersion]


class UpdateExperimentTemplateTargetInput(TypedDict, total=False):
    """Specifies a target for an experiment. You must specify at least one
    Amazon Resource Name (ARN) or at least one resource tag. You cannot
    specify both.
    """

    resourceType: TargetResourceTypeId
    resourceArns: Optional[ResourceArnList]
    resourceTags: Optional[TagMap]
    filters: Optional[ExperimentTemplateTargetFilterInputList]
    selectionMode: ExperimentTemplateTargetSelectionMode
    parameters: Optional[ExperimentTemplateTargetParameterMap]


UpdateExperimentTemplateTargetInputMap = Dict[
    ExperimentTemplateTargetName, UpdateExperimentTemplateTargetInput
]


class UpdateExperimentTemplateStopConditionInput(TypedDict, total=False):
    """Specifies a stop condition for an experiment. You can define a stop
    condition as a CloudWatch alarm.
    """

    source: StopConditionSource
    value: Optional[StopConditionValue]


UpdateExperimentTemplateStopConditionInputList = List[UpdateExperimentTemplateStopConditionInput]


class UpdateExperimentTemplateRequest(ServiceRequest):
    id: ExperimentTemplateId
    description: Optional[ExperimentTemplateDescription]
    stopConditions: Optional[UpdateExperimentTemplateStopConditionInputList]
    targets: Optional[UpdateExperimentTemplateTargetInputMap]
    actions: Optional[UpdateExperimentTemplateActionInputMap]
    roleArn: Optional[RoleArn]
    logConfiguration: Optional[UpdateExperimentTemplateLogConfigurationInput]


class UpdateExperimentTemplateResponse(TypedDict, total=False):
    experimentTemplate: Optional[ExperimentTemplate]


class FisApi:
    service = "fis"
    version = "2020-12-01"

    @handler("CreateExperimentTemplate")
    def create_experiment_template(
        self,
        context: RequestContext,
        client_token: ClientToken,
        description: ExperimentTemplateDescription,
        stop_conditions: CreateExperimentTemplateStopConditionInputList,
        actions: CreateExperimentTemplateActionInputMap,
        role_arn: RoleArn,
        targets: CreateExperimentTemplateTargetInputMap = None,
        tags: TagMap = None,
        log_configuration: CreateExperimentTemplateLogConfigurationInput = None,
    ) -> CreateExperimentTemplateResponse:
        """Creates an experiment template.

        An experiment template includes the following components:

        -  **Targets**: A target can be a specific resource in your Amazon Web
           Services environment, or one or more resources that match criteria
           that you specify, for example, resources that have specific tags.

        -  **Actions**: The actions to carry out on the target. You can specify
           multiple actions, the duration of each action, and when to start each
           action during an experiment.

        -  **Stop conditions**: If a stop condition is triggered while an
           experiment is running, the experiment is automatically stopped. You
           can define a stop condition as a CloudWatch alarm.

        For more information, see `Experiment
        templates <https://docs.aws.amazon.com/fis/latest/userguide/experiment-templates.html>`__
        in the *Fault Injection Simulator User Guide*.

        :param client_token: Unique, case-sensitive identifier that you provide to ensure the
        idempotency of the request.
        :param description: A description for the experiment template.
        :param stop_conditions: The stop conditions.
        :param actions: The actions for the experiment.
        :param role_arn: The Amazon Resource Name (ARN) of an IAM role that grants the FIS
        service permission to perform service actions on your behalf.
        :param targets: The targets for the experiment.
        :param tags: The tags to apply to the experiment template.
        :param log_configuration: The configuration for experiment logging.
        :returns: CreateExperimentTemplateResponse
        :raises ValidationException:
        :raises ConflictException:
        :raises ResourceNotFoundException:
        :raises ServiceQuotaExceededException:
        """
        raise NotImplementedError

    @handler("DeleteExperimentTemplate")
    def delete_experiment_template(
        self, context: RequestContext, id: ExperimentTemplateId
    ) -> DeleteExperimentTemplateResponse:
        """Deletes the specified experiment template.

        :param id: The ID of the experiment template.
        :returns: DeleteExperimentTemplateResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetAction")
    def get_action(self, context: RequestContext, id: ActionId) -> GetActionResponse:
        """Gets information about the specified FIS action.

        :param id: The ID of the action.
        :returns: GetActionResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetExperiment")
    def get_experiment(self, context: RequestContext, id: ExperimentId) -> GetExperimentResponse:
        """Gets information about the specified experiment.

        :param id: The ID of the experiment.
        :returns: GetExperimentResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetExperimentTemplate")
    def get_experiment_template(
        self, context: RequestContext, id: ExperimentTemplateId
    ) -> GetExperimentTemplateResponse:
        """Gets information about the specified experiment template.

        :param id: The ID of the experiment template.
        :returns: GetExperimentTemplateResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetTargetResourceType")
    def get_target_resource_type(
        self, context: RequestContext, resource_type: TargetResourceTypeId
    ) -> GetTargetResourceTypeResponse:
        """Gets information about the specified resource type.

        :param resource_type: The resource type.
        :returns: GetTargetResourceTypeResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("ListActions")
    def list_actions(
        self,
        context: RequestContext,
        max_results: ListActionsMaxResults = None,
        next_token: NextToken = None,
    ) -> ListActionsResponse:
        """Lists the available FIS actions.

        :param max_results: The maximum number of results to return with a single call.
        :param next_token: The token for the next page of results.
        :returns: ListActionsResponse
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListExperimentTemplates")
    def list_experiment_templates(
        self,
        context: RequestContext,
        max_results: ListExperimentTemplatesMaxResults = None,
        next_token: NextToken = None,
    ) -> ListExperimentTemplatesResponse:
        """Lists your experiment templates.

        :param max_results: The maximum number of results to return with a single call.
        :param next_token: The token for the next page of results.
        :returns: ListExperimentTemplatesResponse
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListExperiments")
    def list_experiments(
        self,
        context: RequestContext,
        max_results: ListExperimentsMaxResults = None,
        next_token: NextToken = None,
    ) -> ListExperimentsResponse:
        """Lists your experiments.

        :param max_results: The maximum number of results to return with a single call.
        :param next_token: The token for the next page of results.
        :returns: ListExperimentsResponse
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(
        self, context: RequestContext, resource_arn: ResourceArn
    ) -> ListTagsForResourceResponse:
        """Lists the tags for the specified resource.

        :param resource_arn: The Amazon Resource Name (ARN) of the resource.
        :returns: ListTagsForResourceResponse
        """
        raise NotImplementedError

    @handler("ListTargetResourceTypes")
    def list_target_resource_types(
        self,
        context: RequestContext,
        max_results: ListTargetResourceTypesMaxResults = None,
        next_token: NextToken = None,
    ) -> ListTargetResourceTypesResponse:
        """Lists the target resource types.

        :param max_results: The maximum number of results to return with a single call.
        :param next_token: The token for the next page of results.
        :returns: ListTargetResourceTypesResponse
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("StartExperiment")
    def start_experiment(
        self,
        context: RequestContext,
        client_token: ClientToken,
        experiment_template_id: ExperimentTemplateId,
        tags: TagMap = None,
    ) -> StartExperimentResponse:
        """Starts running an experiment from the specified experiment template.

        :param client_token: Unique, case-sensitive identifier that you provide to ensure the
        idempotency of the request.
        :param experiment_template_id: The ID of the experiment template.
        :param tags: The tags to apply to the experiment.
        :returns: StartExperimentResponse
        :raises ValidationException:
        :raises ConflictException:
        :raises ResourceNotFoundException:
        :raises ServiceQuotaExceededException:
        """
        raise NotImplementedError

    @handler("StopExperiment")
    def stop_experiment(self, context: RequestContext, id: ExperimentId) -> StopExperimentResponse:
        """Stops the specified experiment.

        :param id: The ID of the experiment.
        :returns: StopExperimentResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(
        self, context: RequestContext, resource_arn: ResourceArn, tags: TagMap
    ) -> TagResourceResponse:
        """Applies the specified tags to the specified resource.

        :param resource_arn: The Amazon Resource Name (ARN) of the resource.
        :param tags: The tags for the resource.
        :returns: TagResourceResponse
        """
        raise NotImplementedError

    @handler("UntagResource")
    def untag_resource(
        self, context: RequestContext, resource_arn: ResourceArn, tag_keys: TagKeyList = None
    ) -> UntagResourceResponse:
        """Removes the specified tags from the specified resource.

        :param resource_arn: The Amazon Resource Name (ARN) of the resource.
        :param tag_keys: The tag keys to remove.
        :returns: UntagResourceResponse
        """
        raise NotImplementedError

    @handler("UpdateExperimentTemplate")
    def update_experiment_template(
        self,
        context: RequestContext,
        id: ExperimentTemplateId,
        description: ExperimentTemplateDescription = None,
        stop_conditions: UpdateExperimentTemplateStopConditionInputList = None,
        targets: UpdateExperimentTemplateTargetInputMap = None,
        actions: UpdateExperimentTemplateActionInputMap = None,
        role_arn: RoleArn = None,
        log_configuration: UpdateExperimentTemplateLogConfigurationInput = None,
    ) -> UpdateExperimentTemplateResponse:
        """Updates the specified experiment template.

        :param id: The ID of the experiment template.
        :param description: A description for the template.
        :param stop_conditions: The stop conditions for the experiment.
        :param targets: The targets for the experiment.
        :param actions: The actions for the experiment.
        :param role_arn: The Amazon Resource Name (ARN) of an IAM role that grants the FIS
        service permission to perform service actions on your behalf.
        :param log_configuration: The configuration for experiment logging.
        :returns: UpdateExperimentTemplateResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises ServiceQuotaExceededException:
        """
        raise NotImplementedError
