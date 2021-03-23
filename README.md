# gigbox

Gigbox is a expo / react native frontend and a flask / rethinkdb backend that allows delivery app
workers to collect and gather data about their working life, share it with other workers, and
contribute to research examining people's experiences with gig work.

# front end

# backend

The backend is powered by Flask, Flask-Restful, and RethinkDB.

## Authentication and Security

Authentication is important to this project, as the data being collected is sensitive information
about worker experiences that at times can and has been used to bring retribution on workers from
the apps that employ them.

To maintain anonymity, we follow a few general protocols:

1. authentication and user data is stored without any explicit personal identifiers. for example, we use user
   phone numbers to deliver one-time-login passcodes, but hash the phone numbers we receive so they
   are unreadable by anyone accessing the database. Twilio, the service we use to deliver texts, is
   wiped regularly.

We use [this
trick](https://zohaib.me/using-path-aliases-in-react-native-typescript-created-with-expo/) to import
a custom tailwind
