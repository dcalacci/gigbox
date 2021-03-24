from flask_restful import reqparse, abort, Resource
from flask import Blueprint, request, jsonify, g
from flask import current_app, request


from api.controllers.errors import ValidationError
from api.controllers.auth import login_required
from api.models import Shift, Locations


class CreateShift(Resource):

    @login_required
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('startTime',
                            type=str,
                            help="You need to send a start time: {error_msg}",
                            required=True)
        args = parser.parse_args()
        startTime = args.get('startTime')
        try:
            doc = Shift.create(
                startTime=startTime,
                userId=g.user['id'],
                locations=[],
                endTime="",
                active=True
            )
            return {
                'shiftCreated': True,
                'status': 200,
                'shift': doc
            }
        except ValidationError as e:
            current_app.logger.info("Could not create shift: {}".format(e))

    @login_required
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('fields',
                            type=dict,
                            help="you need to send a dict of attributes to update: {error_msg}",
                            required=True)
        parser.add_argument('shiftId',
                            type=str,
                            help="Id of the shift to update",
                            required=True)
        args = parser.parse_args()
        fields = args.get('fields')
        shiftId = args.get('shiftId')
        try:
            updated = Shift.update(shiftId, fields)
            # TODO: check if it is updated, change response accordingly.
            if len(updated['changes']) > 0:
                return {
                    'status': 200,
                    'shift': updated['changes'][0],
                    'updated': True
                }
            else:
                return {
                    'status': 200,
                    'updated': False
                }
        except ValidationError as e:
            current_app.logger.error("Couldn't update Shift: {}".format(e))


class ShiftLocation(Resource):
    @login_required
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('locations',
                            type=list,
                            help="You need to send a list of locations: {error_msg}",
                            location='json',
                            required=True)
        parser.add_argument('shiftId',
                            type=str,
                            location='json',
                            help="You need to specify a valid shift ID to add locations to: {error_msg}",
                            required=True)
        parser.add_argument('jobId',
                            type=str,
                            location='json',
                            help="You can add a Job ID here",
                            required=False)
        args = parser.parse_args()
        locations = args.get('locations')
        shiftId = args.get('shiftId')
        jobId = args.get('jobId')

        locs = []

        print("Got locations:", locations)

        for l in locations:
            loc = {
                'timestamp': l['timestamp'],
                'lng': l['lng'],
                'lat': l['lat'],
            }
            locs.append(loc)
        
        try:
            docs = Locations.create(locs=locs, shiftId=shiftId, userId=g.user['id'], jobId=jobId)
        except ValidationError as e:
            current_app.logger.info(
                "Could not create location record: {}".format(e))
            docs = []
        print("Sending docs:", docs)

        return {
            'status': 200,
            'locations': docs
        }
