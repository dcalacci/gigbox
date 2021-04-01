from api.graphql.mutation import Mutation
from api.graphql.query import Query
import graphene

schema = graphene.Schema(query=Query, mutation=Mutation)
