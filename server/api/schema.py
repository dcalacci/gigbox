import graphene

from api.graphql.mutation import Mutation
from api.graphql.query import Query

schema = graphene.Schema(query=Query, mutation=Mutation)
