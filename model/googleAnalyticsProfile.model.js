const mongoose = require('mongoose')

const GoogleAnalyticsProfileSchema = mongoose.Schema(
    {
        // refreshToken: { type: String },
        // accessToken: { type: String },
        // UserId: { type: Number, required: true, ref: 'user' },
        // google_id: { type: String },

        id: { type: String },
        displayName: { type: String },
        name: { familyName: { type: String }, givenName: { type: String } },
        emails: [{ value: { type: String }, verified: { type: boolean } }],
        photos: [
            {
                value: { type: String },
            },
        ],
        provider: { type: String },
        _raw: { type: String },
        _json: {
            sub: { type: String },
            name: { type: String },
            given_name: { type: String },
            family_name: { type: String },
            profile: { type: String },
            picture: { type: String },
            email: { type: String },
            email_verified: { type: boolean },
            locale: { type: String },
            hd: { type: String },
        },

        /*
        
        profile {
          id: { type: String },
          displayName:{ type: String },
          name: { familyName: 'jebali', givenName: 'Meriem' },
          emails: [ { value: 'meriem@atayen.us', verified: true } ],
          photos: [
            {
              value: 'https://lh3.googleusercontent.com/a-/AOh14GhhOe29UZwRI1rnGX6s1t4wuSjwjFanvqZzH4NM=s96-c'
            }
          ],
          provider: 'google',
          _raw: '{\n' +
            '  "sub": "118186640998530484761",\n' +
            '  "name": "Meriem jebali",\n' +
            '  "given_name": "Meriem",\n' +
            '  "family_name": "jebali",\n' +
            '  "profile": "https://plus.google.com/118186640998530484761",\n' +
            '  "picture": "https://lh3.googleusercontent.com/a-/AOh14GhhOe29UZwRI1rnGX6s1t4wuSjwjFanvqZzH4NM\\u003ds96-c",\n' +
            '  "email": "meriem@atayen.us",\n' +
            '  "email_verified": true,\n' +
            '  "locale": "fr",\n' +
            '  "hd": "atayen.us"\n' +
            '}',
          _json: {
            sub: '118186640998530484761',
            name: 'Meriem jebali',
            given_name: 'Meriem',
            family_name: 'jebali',
            profile: 'https://plus.google.com/118186640998530484761',
            picture: 'https://lh3.googleusercontent.com/a-/AOh14GhhOe29UZwRI1rnGX6s1t4wuSjwjFanvqZzH4NM=s96-c',
            email: 'meriem@atayen.us',
            email_verified: true,
            locale: 'fr',
            hd: 'atayen.us'
          }
        }
        */

        /*
        
          id: { type: String },
          displayName: { type: String },
          name: { familyName:{ type: String }, givenName:{ type: String }},
          emails: [ { value: { type: String }, verified: { type: boolean } } ],
          photos: [
            {
              value: { type: String }
            }
          ],
          provider: { type: String },
          _raw: { type: String },
          _json: {
            sub: { type: String },
            name: { type: String },
            given_name: { type: String },
            family_name: { type: String },
            profile: '{ type: String },
            picture: { type: String },
            email: { type: String },
            email_verified: { type: boolean },
            locale: { type: String },
            hd: { type: String }
          }
        
        */
    },
    {
        collection: 'google_analytics_profile',
    }
)

const GoogleAnalyticsProfile = mongoose.model(
    'google_analytics_profile',
    GoogleAnalyticsProfileSchema
)
module.exports = GoogleAnalyticsProfile
