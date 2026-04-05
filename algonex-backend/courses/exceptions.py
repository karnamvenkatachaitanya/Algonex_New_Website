from rest_framework.exceptions import APIException
from rest_framework import status


class CourseNotPublished(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This course is not published."
    default_code = "COURSE_NOT_PUBLISHED"


class AlreadyEnrolled(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "You are already enrolled in this course."
    default_code = "ALREADY_ENROLLED"


class CourseNotReady(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Course must have at least one module with topics before publishing."
    default_code = "COURSE_NOT_READY"


class NotEnrolled(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You must be enrolled in this course to leave a review."
    default_code = "NOT_ENROLLED"


class AlreadyReviewed(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "You have already reviewed this course."
    default_code = "ALREADY_REVIEWED"
