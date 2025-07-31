from datetime import datetime
from typing import List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

AccessControlAttributeKey = str
AccessControlAttributeValueSource = str
AccessDeniedExceptionMessage = str
AccountId = str
ConflictExceptionMessage = str
Duration = str
Id = str
InstanceAccessControlAttributeConfigurationStatusReason = str
InstanceArn = str
InternalFailureMessage = str
ManagedPolicyArn = str
ManagedPolicyName = str
ManagedPolicyPath = str
MaxResults = int
Name = str
PermissionSetArn = str
PermissionSetDescription = str
PermissionSetName = str
PermissionSetPolicyDocument = str
PrincipalId = str
Reason = str
RelayState = str
ResourceNotFoundMessage = str
ServiceQuotaExceededMessage = str
TagKey = str
TagValue = str
TaggableResourceArn = str
TargetId = str
ThrottlingExceptionMessage = str
Token = str
UUId = str
ValidationExceptionMessage = str


class InstanceAccessControlAttributeConfigurationStatus(str):
    ENABLED = "ENABLED"
    CREATION_IN_PROGRESS = "CREATION_IN_PROGRESS"
    CREATION_FAILED = "CREATION_FAILED"


class PrincipalType(str):
    USER = "USER"
    GROUP = "GROUP"


class ProvisionTargetType(str):
    AWS_ACCOUNT = "AWS_ACCOUNT"
    ALL_PROVISIONED_ACCOUNTS = "ALL_PROVISIONED_ACCOUNTS"


class ProvisioningStatus(str):
    LATEST_PERMISSION_SET_PROVISIONED = "LATEST_PERMISSION_SET_PROVISIONED"
    LATEST_PERMISSION_SET_NOT_PROVISIONED = "LATEST_PERMISSION_SET_NOT_PROVISIONED"


class StatusValues(str):
    IN_PROGRESS = "IN_PROGRESS"
    FAILED = "FAILED"
    SUCCEEDED = "SUCCEEDED"


class TargetType(str):
    AWS_ACCOUNT = "AWS_ACCOUNT"


class AccessDeniedException(ServiceException):
    """You do not have sufficient access to perform this action."""

    code: str = "AccessDeniedException"
    sender_fault: bool = False
    status_code: int = 400


class ConflictException(ServiceException):
    """Occurs when a conflict with a previous successful write is detected.
    This generally occurs when the previous write did not have time to
    propagate to the host serving the current request. A retry (with
    appropriate backoff logic) is the recommended response to this
    exception.
    """

    code: str = "ConflictException"
    sender_fault: bool = False
    status_code: int = 400


class InternalServerException(ServiceException):
    """The request processing has failed because of an unknown error,
    exception, or failure with an internal server.
    """

    code: str = "InternalServerException"
    sender_fault: bool = False
    status_code: int = 400


class ResourceNotFoundException(ServiceException):
    """Indicates that a requested resource is not found."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 400


class ServiceQuotaExceededException(ServiceException):
    """Indicates that the principal has crossed the permitted number of
    resources that can be created.
    """

    code: str = "ServiceQuotaExceededException"
    sender_fault: bool = False
    status_code: int = 400


class ThrottlingException(ServiceException):
    """Indicates that the principal has crossed the throttling limits of the
    API operations.
    """

    code: str = "ThrottlingException"
    sender_fault: bool = False
    status_code: int = 400


class ValidationException(ServiceException):
    """The request failed because it contains a syntax error."""

    code: str = "ValidationException"
    sender_fault: bool = False
    status_code: int = 400


AccessControlAttributeValueSourceList = List[AccessControlAttributeValueSource]


class AccessControlAttributeValue(TypedDict, total=False):
    """The value used for mapping a specified attribute to an identity source.
    For more information, see `Attribute
    mappings <https://docs.aws.amazon.com/singlesignon/latest/userguide/attributemappingsconcept.html>`__
    in the *IAM Identity Center User Guide*.
    """

    Source: AccessControlAttributeValueSourceList


class AccessControlAttribute(TypedDict, total=False):
    """These are IAM Identity Center identity store attributes that you can
    configure for use in attributes-based access control (ABAC). You can
    create permissions policies that determine who can access your Amazon
    Web Services resources based upon the configured attribute values. When
    you enable ABAC and specify ``AccessControlAttributes``, IAM Identity
    Center passes the attribute values of the authenticated user into IAM
    for use in policy evaluation.
    """

    Key: AccessControlAttributeKey
    Value: AccessControlAttributeValue


AccessControlAttributeList = List[AccessControlAttribute]


class AccountAssignment(TypedDict, total=False):
    """The assignment that indicates a principal's limited access to a
    specified Amazon Web Services account with a specified permission set.

    The term *principal* here refers to a user or group that is defined in
    IAM Identity Center.
    """

    AccountId: Optional[AccountId]
    PermissionSetArn: Optional[PermissionSetArn]
    PrincipalId: Optional[PrincipalId]
    PrincipalType: Optional[PrincipalType]


AccountAssignmentList = List[AccountAssignment]
Date = datetime


class AccountAssignmentOperationStatus(TypedDict, total=False):
    """The status of the creation or deletion operation of an assignment that a
    principal needs to access an account.
    """

    CreatedDate: Optional[Date]
    FailureReason: Optional[Reason]
    PermissionSetArn: Optional[PermissionSetArn]
    PrincipalId: Optional[PrincipalId]
    PrincipalType: Optional[PrincipalType]
    RequestId: Optional[UUId]
    Status: Optional[StatusValues]
    TargetId: Optional[TargetId]
    TargetType: Optional[TargetType]


class AccountAssignmentOperationStatusMetadata(TypedDict, total=False):
    """Provides information about the AccountAssignment creation request."""

    CreatedDate: Optional[Date]
    RequestId: Optional[UUId]
    Status: Optional[StatusValues]


AccountAssignmentOperationStatusList = List[AccountAssignmentOperationStatusMetadata]
AccountList = List[AccountId]


class CustomerManagedPolicyReference(TypedDict, total=False):
    """Specifies the name and path of a customer managed policy. You must have
    an IAM policy that matches the name and path in each Amazon Web Services
    account where you want to deploy your permission set.
    """

    Name: ManagedPolicyName
    Path: Optional[ManagedPolicyPath]


class AttachCustomerManagedPolicyReferenceToPermissionSetRequest(ServiceRequest):
    CustomerManagedPolicyReference: CustomerManagedPolicyReference
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class AttachCustomerManagedPolicyReferenceToPermissionSetResponse(TypedDict, total=False):
    pass


class AttachManagedPolicyToPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    ManagedPolicyArn: ManagedPolicyArn
    PermissionSetArn: PermissionSetArn


class AttachManagedPolicyToPermissionSetResponse(TypedDict, total=False):
    pass


class AttachedManagedPolicy(TypedDict, total=False):
    """A structure that stores the details of the Amazon Web Services managed
    policy.
    """

    Arn: Optional[ManagedPolicyArn]
    Name: Optional[Name]


AttachedManagedPolicyList = List[AttachedManagedPolicy]


class CreateAccountAssignmentRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn
    PrincipalId: PrincipalId
    PrincipalType: PrincipalType
    TargetId: TargetId
    TargetType: TargetType


class CreateAccountAssignmentResponse(TypedDict, total=False):
    AccountAssignmentCreationStatus: Optional[AccountAssignmentOperationStatus]


class InstanceAccessControlAttributeConfiguration(TypedDict, total=False):
    """Specifies the attributes to add to your attribute-based access control
    (ABAC) configuration.
    """

    AccessControlAttributes: AccessControlAttributeList


class CreateInstanceAccessControlAttributeConfigurationRequest(ServiceRequest):
    InstanceAccessControlAttributeConfiguration: InstanceAccessControlAttributeConfiguration
    InstanceArn: InstanceArn


class CreateInstanceAccessControlAttributeConfigurationResponse(TypedDict, total=False):
    pass


class Tag(TypedDict, total=False):
    """A set of key-value pairs that are used to manage the resource. Tags can
    only be applied to permission sets and cannot be applied to
    corresponding roles that IAM Identity Center creates in Amazon Web
    Services accounts.
    """

    Key: TagKey
    Value: TagValue


TagList = List[Tag]


class CreatePermissionSetRequest(ServiceRequest):
    Description: Optional[PermissionSetDescription]
    InstanceArn: InstanceArn
    Name: PermissionSetName
    RelayState: Optional[RelayState]
    SessionDuration: Optional[Duration]
    Tags: Optional[TagList]


class PermissionSet(TypedDict, total=False):
    """An entity that contains IAM policies."""

    CreatedDate: Optional[Date]
    Description: Optional[PermissionSetDescription]
    Name: Optional[PermissionSetName]
    PermissionSetArn: Optional[PermissionSetArn]
    RelayState: Optional[RelayState]
    SessionDuration: Optional[Duration]


class CreatePermissionSetResponse(TypedDict, total=False):
    PermissionSet: Optional[PermissionSet]


CustomerManagedPolicyReferenceList = List[CustomerManagedPolicyReference]


class DeleteAccountAssignmentRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn
    PrincipalId: PrincipalId
    PrincipalType: PrincipalType
    TargetId: TargetId
    TargetType: TargetType


class DeleteAccountAssignmentResponse(TypedDict, total=False):
    AccountAssignmentDeletionStatus: Optional[AccountAssignmentOperationStatus]


class DeleteInlinePolicyFromPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class DeleteInlinePolicyFromPermissionSetResponse(TypedDict, total=False):
    pass


class DeleteInstanceAccessControlAttributeConfigurationRequest(ServiceRequest):
    InstanceArn: InstanceArn


class DeleteInstanceAccessControlAttributeConfigurationResponse(TypedDict, total=False):
    pass


class DeletePermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class DeletePermissionSetResponse(TypedDict, total=False):
    pass


class DeletePermissionsBoundaryFromPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class DeletePermissionsBoundaryFromPermissionSetResponse(TypedDict, total=False):
    pass


class DescribeAccountAssignmentCreationStatusRequest(ServiceRequest):
    AccountAssignmentCreationRequestId: UUId
    InstanceArn: InstanceArn


class DescribeAccountAssignmentCreationStatusResponse(TypedDict, total=False):
    AccountAssignmentCreationStatus: Optional[AccountAssignmentOperationStatus]


class DescribeAccountAssignmentDeletionStatusRequest(ServiceRequest):
    AccountAssignmentDeletionRequestId: UUId
    InstanceArn: InstanceArn


class DescribeAccountAssignmentDeletionStatusResponse(TypedDict, total=False):
    AccountAssignmentDeletionStatus: Optional[AccountAssignmentOperationStatus]


class DescribeInstanceAccessControlAttributeConfigurationRequest(ServiceRequest):
    InstanceArn: InstanceArn


class DescribeInstanceAccessControlAttributeConfigurationResponse(TypedDict, total=False):
    InstanceAccessControlAttributeConfiguration: Optional[
        InstanceAccessControlAttributeConfiguration
    ]
    Status: Optional[InstanceAccessControlAttributeConfigurationStatus]
    StatusReason: Optional[InstanceAccessControlAttributeConfigurationStatusReason]


class DescribePermissionSetProvisioningStatusRequest(ServiceRequest):
    InstanceArn: InstanceArn
    ProvisionPermissionSetRequestId: UUId


class PermissionSetProvisioningStatus(TypedDict, total=False):
    """A structure that is used to provide the status of the provisioning
    operation for a specified permission set.
    """

    AccountId: Optional[AccountId]
    CreatedDate: Optional[Date]
    FailureReason: Optional[Reason]
    PermissionSetArn: Optional[PermissionSetArn]
    RequestId: Optional[UUId]
    Status: Optional[StatusValues]


class DescribePermissionSetProvisioningStatusResponse(TypedDict, total=False):
    PermissionSetProvisioningStatus: Optional[PermissionSetProvisioningStatus]


class DescribePermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class DescribePermissionSetResponse(TypedDict, total=False):
    PermissionSet: Optional[PermissionSet]


class DetachCustomerManagedPolicyReferenceFromPermissionSetRequest(ServiceRequest):
    CustomerManagedPolicyReference: CustomerManagedPolicyReference
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class DetachCustomerManagedPolicyReferenceFromPermissionSetResponse(TypedDict, total=False):
    pass


class DetachManagedPolicyFromPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    ManagedPolicyArn: ManagedPolicyArn
    PermissionSetArn: PermissionSetArn


class DetachManagedPolicyFromPermissionSetResponse(TypedDict, total=False):
    pass


class GetInlinePolicyForPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class GetInlinePolicyForPermissionSetResponse(TypedDict, total=False):
    InlinePolicy: Optional[PermissionSetPolicyDocument]


class GetPermissionsBoundaryForPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class PermissionsBoundary(TypedDict, total=False):
    """Specifies the configuration of the Amazon Web Services managed or
    customer managed policy that you want to set as a permissions boundary.
    Specify either ``CustomerManagedPolicyReference`` to use the name and
    path of a customer managed policy, or ``ManagedPolicyArn`` to use the
    ARN of an Amazon Web Services managed policy. A permissions boundary
    represents the maximum permissions that any policy can grant your role.
    For more information, see `Permissions boundaries for IAM
    entities <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html>`__
    in the *IAM User Guide*.

    Policies used as permissions boundaries don't provide permissions. You
    must also attach an IAM policy to the role. To learn how the effective
    permissions for a role are evaluated, see `IAM JSON policy evaluation
    logic <https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html>`__
    in the *IAM User Guide*.
    """

    CustomerManagedPolicyReference: Optional[CustomerManagedPolicyReference]
    ManagedPolicyArn: Optional[ManagedPolicyArn]


class GetPermissionsBoundaryForPermissionSetResponse(TypedDict, total=False):
    PermissionsBoundary: Optional[PermissionsBoundary]


class InstanceMetadata(TypedDict, total=False):
    """Provides information about the IAM Identity Center instance."""

    IdentityStoreId: Optional[Id]
    InstanceArn: Optional[InstanceArn]


InstanceList = List[InstanceMetadata]


class OperationStatusFilter(TypedDict, total=False):
    """Filters he operation status list based on the passed attribute value."""

    Status: Optional[StatusValues]


class ListAccountAssignmentCreationStatusRequest(ServiceRequest):
    Filter: Optional[OperationStatusFilter]
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]


class ListAccountAssignmentCreationStatusResponse(TypedDict, total=False):
    AccountAssignmentsCreationStatus: Optional[AccountAssignmentOperationStatusList]
    NextToken: Optional[Token]


class ListAccountAssignmentDeletionStatusRequest(ServiceRequest):
    Filter: Optional[OperationStatusFilter]
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]


class ListAccountAssignmentDeletionStatusResponse(TypedDict, total=False):
    AccountAssignmentsDeletionStatus: Optional[AccountAssignmentOperationStatusList]
    NextToken: Optional[Token]


class ListAccountAssignmentsRequest(ServiceRequest):
    AccountId: TargetId
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]
    PermissionSetArn: PermissionSetArn


class ListAccountAssignmentsResponse(TypedDict, total=False):
    AccountAssignments: Optional[AccountAssignmentList]
    NextToken: Optional[Token]


class ListAccountsForProvisionedPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]
    PermissionSetArn: PermissionSetArn
    ProvisioningStatus: Optional[ProvisioningStatus]


class ListAccountsForProvisionedPermissionSetResponse(TypedDict, total=False):
    AccountIds: Optional[AccountList]
    NextToken: Optional[Token]


class ListCustomerManagedPolicyReferencesInPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]
    PermissionSetArn: PermissionSetArn


class ListCustomerManagedPolicyReferencesInPermissionSetResponse(TypedDict, total=False):
    CustomerManagedPolicyReferences: Optional[CustomerManagedPolicyReferenceList]
    NextToken: Optional[Token]


class ListInstancesRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]


class ListInstancesResponse(TypedDict, total=False):
    Instances: Optional[InstanceList]
    NextToken: Optional[Token]


class ListManagedPoliciesInPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]
    PermissionSetArn: PermissionSetArn


class ListManagedPoliciesInPermissionSetResponse(TypedDict, total=False):
    AttachedManagedPolicies: Optional[AttachedManagedPolicyList]
    NextToken: Optional[Token]


class ListPermissionSetProvisioningStatusRequest(ServiceRequest):
    Filter: Optional[OperationStatusFilter]
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]


class PermissionSetProvisioningStatusMetadata(TypedDict, total=False):
    """Provides information about the permission set provisioning status."""

    CreatedDate: Optional[Date]
    RequestId: Optional[UUId]
    Status: Optional[StatusValues]


PermissionSetProvisioningStatusList = List[PermissionSetProvisioningStatusMetadata]


class ListPermissionSetProvisioningStatusResponse(TypedDict, total=False):
    NextToken: Optional[Token]
    PermissionSetsProvisioningStatus: Optional[PermissionSetProvisioningStatusList]


class ListPermissionSetsProvisionedToAccountRequest(ServiceRequest):
    AccountId: AccountId
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]
    ProvisioningStatus: Optional[ProvisioningStatus]


PermissionSetList = List[PermissionSetArn]


class ListPermissionSetsProvisionedToAccountResponse(TypedDict, total=False):
    NextToken: Optional[Token]
    PermissionSets: Optional[PermissionSetList]


class ListPermissionSetsRequest(ServiceRequest):
    InstanceArn: InstanceArn
    MaxResults: Optional[MaxResults]
    NextToken: Optional[Token]


class ListPermissionSetsResponse(TypedDict, total=False):
    NextToken: Optional[Token]
    PermissionSets: Optional[PermissionSetList]


class ListTagsForResourceRequest(ServiceRequest):
    InstanceArn: InstanceArn
    NextToken: Optional[Token]
    ResourceArn: TaggableResourceArn


class ListTagsForResourceResponse(TypedDict, total=False):
    NextToken: Optional[Token]
    Tags: Optional[TagList]


class ProvisionPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn
    TargetId: Optional[TargetId]
    TargetType: ProvisionTargetType


class ProvisionPermissionSetResponse(TypedDict, total=False):
    PermissionSetProvisioningStatus: Optional[PermissionSetProvisioningStatus]


class PutInlinePolicyToPermissionSetRequest(ServiceRequest):
    InlinePolicy: PermissionSetPolicyDocument
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn


class PutInlinePolicyToPermissionSetResponse(TypedDict, total=False):
    pass


class PutPermissionsBoundaryToPermissionSetRequest(ServiceRequest):
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn
    PermissionsBoundary: PermissionsBoundary


class PutPermissionsBoundaryToPermissionSetResponse(TypedDict, total=False):
    pass


TagKeyList = List[TagKey]


class TagResourceRequest(ServiceRequest):
    InstanceArn: InstanceArn
    ResourceArn: TaggableResourceArn
    Tags: TagList


class TagResourceResponse(TypedDict, total=False):
    pass


class UntagResourceRequest(ServiceRequest):
    InstanceArn: InstanceArn
    ResourceArn: TaggableResourceArn
    TagKeys: TagKeyList


class UntagResourceResponse(TypedDict, total=False):
    pass


class UpdateInstanceAccessControlAttributeConfigurationRequest(ServiceRequest):
    InstanceAccessControlAttributeConfiguration: InstanceAccessControlAttributeConfiguration
    InstanceArn: InstanceArn


class UpdateInstanceAccessControlAttributeConfigurationResponse(TypedDict, total=False):
    pass


class UpdatePermissionSetRequest(ServiceRequest):
    Description: Optional[PermissionSetDescription]
    InstanceArn: InstanceArn
    PermissionSetArn: PermissionSetArn
    RelayState: Optional[RelayState]
    SessionDuration: Optional[Duration]


class UpdatePermissionSetResponse(TypedDict, total=False):
    pass


class SsoAdminApi:
    service = "sso-admin"
    version = "2020-07-20"

    @handler("AttachCustomerManagedPolicyReferenceToPermissionSet")
    def attach_customer_managed_policy_reference_to_permission_set(
        self,
        context: RequestContext,
        customer_managed_policy_reference: CustomerManagedPolicyReference,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> AttachCustomerManagedPolicyReferenceToPermissionSetResponse:
        """Attaches the specified customer managed policy to the specified
        PermissionSet.

        :param customer_managed_policy_reference: Specifies the name and path of a customer managed policy.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the ``PermissionSet``.
        :returns: AttachCustomerManagedPolicyReferenceToPermissionSetResponse
        :raises ServiceQuotaExceededException:
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("AttachManagedPolicyToPermissionSet")
    def attach_managed_policy_to_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        managed_policy_arn: ManagedPolicyArn,
        permission_set_arn: PermissionSetArn,
    ) -> AttachManagedPolicyToPermissionSetResponse:
        """Attaches an Amazon Web Services managed policy ARN to a permission set.

        If the permission set is already referenced by one or more account
        assignments, you will need to call ``ProvisionPermissionSet`` after this
        operation. Calling ``ProvisionPermissionSet`` applies the corresponding
        IAM policy updates to all assigned accounts.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param managed_policy_arn: The Amazon Web Services managed policy ARN to be attached to a
        permission set.
        :param permission_set_arn: The ARN of the PermissionSet that the managed policy should be attached
        to.
        :returns: AttachManagedPolicyToPermissionSetResponse
        :raises ServiceQuotaExceededException:
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("CreateAccountAssignment")
    def create_account_assignment(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        principal_id: PrincipalId,
        principal_type: PrincipalType,
        target_id: TargetId,
        target_type: TargetType,
    ) -> CreateAccountAssignmentResponse:
        """Assigns access to a principal for a specified Amazon Web Services
        account using a specified permission set.

        The term *principal* here refers to a user or group that is defined in
        IAM Identity Center.

        As part of a successful ``CreateAccountAssignment`` call, the specified
        permission set will automatically be provisioned to the account in the
        form of an IAM policy. That policy is attached to the IAM role created
        in IAM Identity Center. If the permission set is subsequently updated,
        the corresponding IAM policies attached to roles in your accounts will
        not be updated automatically. In this case, you must call
        ``ProvisionPermissionSet`` to make these updates.

        After a successful response, call
        ``DescribeAccountAssignmentCreationStatus`` to describe the status of an
        assignment creation request.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set that the admin wants to grant the
        principal access to.
        :param principal_id: An identifier for an object in IAM Identity Center, such as a user or
        group.
        :param principal_type: The entity type for which the assignment will be created.
        :param target_id: TargetID is an Amazon Web Services account identifier, (For example,
        123456789012).
        :param target_type: The entity type for which the assignment will be created.
        :returns: CreateAccountAssignmentResponse
        :raises ServiceQuotaExceededException:
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("CreateInstanceAccessControlAttributeConfiguration")
    def create_instance_access_control_attribute_configuration(
        self,
        context: RequestContext,
        instance_access_control_attribute_configuration: InstanceAccessControlAttributeConfiguration,
        instance_arn: InstanceArn,
    ) -> CreateInstanceAccessControlAttributeConfigurationResponse:
        """Enables the attributes-based access control (ABAC) feature for the
        specified IAM Identity Center instance. You can also specify new
        attributes to add to your ABAC configuration during the enabling
        process. For more information about ABAC, see `Attribute-Based Access
        Control </singlesignon/latest/userguide/abac.html>`__ in the *IAM
        Identity Center User Guide*.

        After a successful response, call
        ``DescribeInstanceAccessControlAttributeConfiguration`` to validate that
        ``InstanceAccessControlAttributeConfiguration`` was created.

        :param instance_access_control_attribute_configuration: Specifies the IAM Identity Center identity store attributes to add to
        your ABAC configuration.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :returns: CreateInstanceAccessControlAttributeConfigurationResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("CreatePermissionSet")
    def create_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        name: PermissionSetName,
        description: PermissionSetDescription = None,
        relay_state: RelayState = None,
        session_duration: Duration = None,
        tags: TagList = None,
    ) -> CreatePermissionSetResponse:
        """Creates a permission set within a specified IAM Identity Center
        instance.

        To grant users and groups access to Amazon Web Services account
        resources, use ``CreateAccountAssignment``.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param name: The name of the PermissionSet.
        :param description: The description of the PermissionSet.
        :param relay_state: Used to redirect users within the application during the federation
        authentication process.
        :param session_duration: The length of time that the application user sessions are valid in the
        ISO-8601 standard.
        :param tags: The tags to attach to the new PermissionSet.
        :returns: CreatePermissionSetResponse
        :raises ServiceQuotaExceededException:
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("DeleteAccountAssignment")
    def delete_account_assignment(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        principal_id: PrincipalId,
        principal_type: PrincipalType,
        target_id: TargetId,
        target_type: TargetType,
    ) -> DeleteAccountAssignmentResponse:
        """Deletes a principal's access from a specified Amazon Web Services
        account using a specified permission set.

        After a successful response, call
        ``DescribeAccountAssignmentDeletionStatus`` to describe the status of an
        assignment deletion request.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set that will be used to remove access.
        :param principal_id: An identifier for an object in IAM Identity Center, such as a user or
        group.
        :param principal_type: The entity type for which the assignment will be deleted.
        :param target_id: TargetID is an Amazon Web Services account identifier, (For example,
        123456789012).
        :param target_type: The entity type for which the assignment will be deleted.
        :returns: DeleteAccountAssignmentResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("DeleteInlinePolicyFromPermissionSet")
    def delete_inline_policy_from_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> DeleteInlinePolicyFromPermissionSetResponse:
        """Deletes the inline policy from a specified permission set.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set that will be used to remove access.
        :returns: DeleteInlinePolicyFromPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("DeleteInstanceAccessControlAttributeConfiguration")
    def delete_instance_access_control_attribute_configuration(
        self, context: RequestContext, instance_arn: InstanceArn
    ) -> DeleteInstanceAccessControlAttributeConfigurationResponse:
        """Disables the attributes-based access control (ABAC) feature for the
        specified IAM Identity Center instance and deletes all of the attribute
        mappings that have been configured. Once deleted, any attributes that
        are received from an identity source and any custom attributes you have
        previously configured will not be passed. For more information about
        ABAC, see `Attribute-Based Access
        Control </singlesignon/latest/userguide/abac.html>`__ in the *IAM
        Identity Center User Guide*.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :returns: DeleteInstanceAccessControlAttributeConfigurationResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("DeletePermissionSet")
    def delete_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> DeletePermissionSetResponse:
        """Deletes the specified permission set.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set that should be deleted.
        :returns: DeletePermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("DeletePermissionsBoundaryFromPermissionSet")
    def delete_permissions_boundary_from_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> DeletePermissionsBoundaryFromPermissionSetResponse:
        """Deletes the permissions boundary from a specified PermissionSet.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the ``PermissionSet``.
        :returns: DeletePermissionsBoundaryFromPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("DescribeAccountAssignmentCreationStatus")
    def describe_account_assignment_creation_status(
        self,
        context: RequestContext,
        account_assignment_creation_request_id: UUId,
        instance_arn: InstanceArn,
    ) -> DescribeAccountAssignmentCreationStatusResponse:
        """Describes the status of the assignment creation request.

        :param account_assignment_creation_request_id: The identifier that is used to track the request operation progress.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :returns: DescribeAccountAssignmentCreationStatusResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("DescribeAccountAssignmentDeletionStatus")
    def describe_account_assignment_deletion_status(
        self,
        context: RequestContext,
        account_assignment_deletion_request_id: UUId,
        instance_arn: InstanceArn,
    ) -> DescribeAccountAssignmentDeletionStatusResponse:
        """Describes the status of the assignment deletion request.

        :param account_assignment_deletion_request_id: The identifier that is used to track the request operation progress.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :returns: DescribeAccountAssignmentDeletionStatusResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("DescribeInstanceAccessControlAttributeConfiguration")
    def describe_instance_access_control_attribute_configuration(
        self, context: RequestContext, instance_arn: InstanceArn
    ) -> DescribeInstanceAccessControlAttributeConfigurationResponse:
        """Returns the list of IAM Identity Center identity store attributes that
        have been configured to work with attributes-based access control (ABAC)
        for the specified IAM Identity Center instance. This will not return
        attributes configured and sent by an external identity provider. For
        more information about ABAC, see `Attribute-Based Access
        Control </singlesignon/latest/userguide/abac.html>`__ in the *IAM
        Identity Center User Guide*.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :returns: DescribeInstanceAccessControlAttributeConfigurationResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("DescribePermissionSet")
    def describe_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> DescribePermissionSetResponse:
        """Gets the details of the permission set.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set.
        :returns: DescribePermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("DescribePermissionSetProvisioningStatus")
    def describe_permission_set_provisioning_status(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        provision_permission_set_request_id: UUId,
    ) -> DescribePermissionSetProvisioningStatusResponse:
        """Describes the status for the given permission set provisioning request.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param provision_permission_set_request_id: The identifier that is provided by the ProvisionPermissionSet call to
        retrieve the current status of the provisioning workflow.
        :returns: DescribePermissionSetProvisioningStatusResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("DetachCustomerManagedPolicyReferenceFromPermissionSet")
    def detach_customer_managed_policy_reference_from_permission_set(
        self,
        context: RequestContext,
        customer_managed_policy_reference: CustomerManagedPolicyReference,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> DetachCustomerManagedPolicyReferenceFromPermissionSetResponse:
        """Detaches the specified customer managed policy from the specified
        PermissionSet.

        :param customer_managed_policy_reference: Specifies the name and path of a customer managed policy.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the ``PermissionSet``.
        :returns: DetachCustomerManagedPolicyReferenceFromPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("DetachManagedPolicyFromPermissionSet")
    def detach_managed_policy_from_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        managed_policy_arn: ManagedPolicyArn,
        permission_set_arn: PermissionSetArn,
    ) -> DetachManagedPolicyFromPermissionSetResponse:
        """Detaches the attached Amazon Web Services managed policy ARN from the
        specified permission set.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param managed_policy_arn: The Amazon Web Services managed policy ARN to be detached from a
        permission set.
        :param permission_set_arn: The ARN of the PermissionSet from which the policy should be detached.
        :returns: DetachManagedPolicyFromPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("GetInlinePolicyForPermissionSet")
    def get_inline_policy_for_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> GetInlinePolicyForPermissionSetResponse:
        """Obtains the inline policy assigned to the permission set.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set.
        :returns: GetInlinePolicyForPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("GetPermissionsBoundaryForPermissionSet")
    def get_permissions_boundary_for_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> GetPermissionsBoundaryForPermissionSetResponse:
        """Obtains the permissions boundary for a specified PermissionSet.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the ``PermissionSet``.
        :returns: GetPermissionsBoundaryForPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListAccountAssignmentCreationStatus")
    def list_account_assignment_creation_status(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        filter: OperationStatusFilter = None,
        max_results: MaxResults = None,
        next_token: Token = None,
    ) -> ListAccountAssignmentCreationStatusResponse:
        """Lists the status of the Amazon Web Services account assignment creation
        requests for a specified IAM Identity Center instance.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param filter: Filters results based on the passed attribute value.
        :param max_results: The maximum number of results to display for the assignment.
        :param next_token: The pagination token for the list API.
        :returns: ListAccountAssignmentCreationStatusResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListAccountAssignmentDeletionStatus")
    def list_account_assignment_deletion_status(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        filter: OperationStatusFilter = None,
        max_results: MaxResults = None,
        next_token: Token = None,
    ) -> ListAccountAssignmentDeletionStatusResponse:
        """Lists the status of the Amazon Web Services account assignment deletion
        requests for a specified IAM Identity Center instance.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param filter: Filters results based on the passed attribute value.
        :param max_results: The maximum number of results to display for the assignment.
        :param next_token: The pagination token for the list API.
        :returns: ListAccountAssignmentDeletionStatusResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListAccountAssignments")
    def list_account_assignments(
        self,
        context: RequestContext,
        account_id: TargetId,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        max_results: MaxResults = None,
        next_token: Token = None,
    ) -> ListAccountAssignmentsResponse:
        """Lists the assignee of the specified Amazon Web Services account with the
        specified permission set.

        :param account_id: The identifier of the Amazon Web Services account from which to list the
        assignments.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set from which to list assignments.
        :param max_results: The maximum number of results to display for the assignment.
        :param next_token: The pagination token for the list API.
        :returns: ListAccountAssignmentsResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListAccountsForProvisionedPermissionSet")
    def list_accounts_for_provisioned_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        max_results: MaxResults = None,
        next_token: Token = None,
        provisioning_status: ProvisioningStatus = None,
    ) -> ListAccountsForProvisionedPermissionSetResponse:
        """Lists all the Amazon Web Services accounts where the specified
        permission set is provisioned.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the PermissionSet from which the associated Amazon Web
        Services accounts will be listed.
        :param max_results: The maximum number of results to display for the PermissionSet.
        :param next_token: The pagination token for the list API.
        :param provisioning_status: The permission set provisioning status for an Amazon Web Services
        account.
        :returns: ListAccountsForProvisionedPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListCustomerManagedPolicyReferencesInPermissionSet")
    def list_customer_managed_policy_references_in_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        max_results: MaxResults = None,
        next_token: Token = None,
    ) -> ListCustomerManagedPolicyReferencesInPermissionSetResponse:
        """Lists all customer managed policies attached to a specified
        PermissionSet.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the ``PermissionSet``.
        :param max_results: The maximum number of results to display for the list call.
        :param next_token: The pagination token for the list API.
        :returns: ListCustomerManagedPolicyReferencesInPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListInstances")
    def list_instances(
        self, context: RequestContext, max_results: MaxResults = None, next_token: Token = None
    ) -> ListInstancesResponse:
        """Lists the IAM Identity Center instances that the caller has access to.

        :param max_results: The maximum number of results to display for the instance.
        :param next_token: The pagination token for the list API.
        :returns: ListInstancesResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListManagedPoliciesInPermissionSet")
    def list_managed_policies_in_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        max_results: MaxResults = None,
        next_token: Token = None,
    ) -> ListManagedPoliciesInPermissionSetResponse:
        """Lists the Amazon Web Services managed policy that is attached to a
        specified permission set.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the PermissionSet whose managed policies will be listed.
        :param max_results: The maximum number of results to display for the PermissionSet.
        :param next_token: The pagination token for the list API.
        :returns: ListManagedPoliciesInPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListPermissionSetProvisioningStatus")
    def list_permission_set_provisioning_status(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        filter: OperationStatusFilter = None,
        max_results: MaxResults = None,
        next_token: Token = None,
    ) -> ListPermissionSetProvisioningStatusResponse:
        """Lists the status of the permission set provisioning requests for a
        specified IAM Identity Center instance.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param filter: Filters results based on the passed attribute value.
        :param max_results: The maximum number of results to display for the assignment.
        :param next_token: The pagination token for the list API.
        :returns: ListPermissionSetProvisioningStatusResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListPermissionSets")
    def list_permission_sets(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        max_results: MaxResults = None,
        next_token: Token = None,
    ) -> ListPermissionSetsResponse:
        """Lists the PermissionSets in an IAM Identity Center instance.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param max_results: The maximum number of results to display for the assignment.
        :param next_token: The pagination token for the list API.
        :returns: ListPermissionSetsResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListPermissionSetsProvisionedToAccount")
    def list_permission_sets_provisioned_to_account(
        self,
        context: RequestContext,
        account_id: AccountId,
        instance_arn: InstanceArn,
        max_results: MaxResults = None,
        next_token: Token = None,
        provisioning_status: ProvisioningStatus = None,
    ) -> ListPermissionSetsProvisionedToAccountResponse:
        """Lists all the permission sets that are provisioned to a specified Amazon
        Web Services account.

        :param account_id: The identifier of the Amazon Web Services account from which to list the
        assignments.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param max_results: The maximum number of results to display for the assignment.
        :param next_token: The pagination token for the list API.
        :param provisioning_status: The status object for the permission set provisioning operation.
        :returns: ListPermissionSetsProvisionedToAccountResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        resource_arn: TaggableResourceArn,
        next_token: Token = None,
    ) -> ListTagsForResourceResponse:
        """Lists the tags that are attached to a specified resource.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param resource_arn: The ARN of the resource with the tags to be listed.
        :param next_token: The pagination token for the list API.
        :returns: ListTagsForResourceResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ProvisionPermissionSet")
    def provision_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        target_type: ProvisionTargetType,
        target_id: TargetId = None,
    ) -> ProvisionPermissionSetResponse:
        """The process by which a specified permission set is provisioned to the
        specified target.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set.
        :param target_type: The entity type for which the assignment will be created.
        :param target_id: TargetID is an Amazon Web Services account identifier, (For example,
        123456789012).
        :returns: ProvisionPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("PutInlinePolicyToPermissionSet")
    def put_inline_policy_to_permission_set(
        self,
        context: RequestContext,
        inline_policy: PermissionSetPolicyDocument,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
    ) -> PutInlinePolicyToPermissionSetResponse:
        """Attaches an inline policy to a permission set.

        If the permission set is already referenced by one or more account
        assignments, you will need to call ``ProvisionPermissionSet`` after this
        action to apply the corresponding IAM policy updates to all assigned
        accounts.

        :param inline_policy: The inline policy to attach to a PermissionSet.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set.
        :returns: PutInlinePolicyToPermissionSetResponse
        :raises ServiceQuotaExceededException:
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("PutPermissionsBoundaryToPermissionSet")
    def put_permissions_boundary_to_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        permissions_boundary: PermissionsBoundary,
    ) -> PutPermissionsBoundaryToPermissionSetResponse:
        """Attaches an Amazon Web Services managed or customer managed policy to
        the specified PermissionSet as a permissions boundary.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the ``PermissionSet``.
        :param permissions_boundary: The permissions boundary that you want to attach to a ``PermissionSet``.
        :returns: PutPermissionsBoundaryToPermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        resource_arn: TaggableResourceArn,
        tags: TagList,
    ) -> TagResourceResponse:
        """Associates a set of tags with a specified resource.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param resource_arn: The ARN of the resource with the tags to be listed.
        :param tags: A set of key-value pairs that are used to manage the resource.
        :returns: TagResourceResponse
        :raises ServiceQuotaExceededException:
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("UntagResource")
    def untag_resource(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        resource_arn: TaggableResourceArn,
        tag_keys: TagKeyList,
    ) -> UntagResourceResponse:
        """Disassociates a set of tags from a specified resource.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param resource_arn: The ARN of the resource with the tags to be listed.
        :param tag_keys: The keys of tags that are attached to the resource.
        :returns: UntagResourceResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("UpdateInstanceAccessControlAttributeConfiguration")
    def update_instance_access_control_attribute_configuration(
        self,
        context: RequestContext,
        instance_access_control_attribute_configuration: InstanceAccessControlAttributeConfiguration,
        instance_arn: InstanceArn,
    ) -> UpdateInstanceAccessControlAttributeConfigurationResponse:
        """Updates the IAM Identity Center identity store attributes that you can
        use with the IAM Identity Center instance for attributes-based access
        control (ABAC). When using an external identity provider as an identity
        source, you can pass attributes through the SAML assertion as an
        alternative to configuring attributes from the IAM Identity Center
        identity store. If a SAML assertion passes any of these attributes, IAM
        Identity Center replaces the attribute value with the value from the IAM
        Identity Center identity store. For more information about ABAC, see
        `Attribute-Based Access
        Control </singlesignon/latest/userguide/abac.html>`__ in the *IAM
        Identity Center User Guide*.

        :param instance_access_control_attribute_configuration: Updates the attributes for your ABAC configuration.
        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :returns: UpdateInstanceAccessControlAttributeConfigurationResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError

    @handler("UpdatePermissionSet")
    def update_permission_set(
        self,
        context: RequestContext,
        instance_arn: InstanceArn,
        permission_set_arn: PermissionSetArn,
        description: PermissionSetDescription = None,
        relay_state: RelayState = None,
        session_duration: Duration = None,
    ) -> UpdatePermissionSetResponse:
        """Updates an existing permission set.

        :param instance_arn: The ARN of the IAM Identity Center instance under which the operation
        will be executed.
        :param permission_set_arn: The ARN of the permission set.
        :param description: The description of the PermissionSet.
        :param relay_state: Used to redirect users within the application during the federation
        authentication process.
        :param session_duration: The length of time that the application user sessions are valid for in
        the ISO-8601 standard.
        :returns: UpdatePermissionSetResponse
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ValidationException:
        :raises ConflictException:
        """
        raise NotImplementedError
