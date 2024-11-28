# from django.contrib.auth.backends import ModelBackend
# from django.contrib.auth.models import User

# class EmailBackend(ModelBackend):
#     def authenticate(self, request, username=None, password=None, **kwargs):
#         try:
#             user = User.objects.get(email=username)
#             if user.check_password(password):
#                 return user
#         except User.DoesNotExist:
#             return None

# from django.contrib.auth.backends import BaseBackend
# # from django.contrib.auth.models import User
# from user.models import User
# import sys

# class EmailBackend(BaseBackend):
#     """
#     Custom authentication backend that allows users to log in using their email and password.
#     """

#     def authenticate(self, request, user_email=None, password=None, **kwargs):
#         try:
#             if User.objects.filter(user="emilien").exists():
#                 print(f"IL EXISTE !")
#             print(f"EMAILBACKEND : ", user_email, file=sys.stderr)
#             print(f"Retour : ", User.objects.get(email=user_email), file=sys.stderr)
#             # user = User.objects.get(email=user_email)
#             query_set = User.objects.all()
#             cat = query_set.filter(email=user_email)
#             print(f"EMAILBACKEND AFTER: ", cat, file=sys.stderr)
#             if (cat.password==password):
#                 return cat
#         except User.DoesNotExist:
#             return None
#         return None

#     def get_user(self, user_id):
#         try:
#             return User.objects.get(pk=user_id)
#         except User.DoesNotExist:
#             return None

from django.contrib.auth.backends import BaseBackend
from user.models import User
import sys


class EmailBackend(BaseBackend):
    """
    Custom authentication backend that allows users to log in using their email and password.
    """

    def authenticate(self, request, user_email=None, password=None, **kwargs):
        try:
            # Récupérer l'utilisateur correspondant à l'email (ou None si l'utilisateur n'existe pas)
            user = User.objects.filter(email=user_email).first()

            print(f"EMAILBACKEND: user_email = {user_email}", file=sys.stderr)
            print(f"USER FOUND: {user}", file=sys.stderr)

            if user is not None:
                # Vérifier le mot de passe
                # if user.check_password(password):
                #     print(f"AUTH SUCCESS: {user.email}", file=sys.stderr)
                    return user
            #     else:
            #         print(f"INVALID PASSWORD for {user.email}", file=sys.stderr)
            else:
                print("User not found", file=sys.stderr)

        except Exception as e:
            print(f"AUTH ERROR: {str(e)}", file=sys.stderr)

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None