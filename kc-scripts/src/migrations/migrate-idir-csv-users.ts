import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import * as csv from '@fast-csv/format';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import { parse } from 'csv-parse/sync';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { getAdminClient } from 'core';
import { fetchIdirUser } from 'helpers/webservice-idir';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { IDIR_USERNAME } from 'config';

const basePath = path.join(__dirname, 'exports');



const argv = yargs(process.argv.slice(2))
  .options({
    filePath: { type: 'string', default: '' },
    realm: { type: 'string', default: 'default'},
    env: { type: 'string', default: '' },
    concurrency: { type: 'number', default: 30 },
    auto: { type: 'boolean', default: false },
    totp: { type: 'string', default: ''}
  })
  .parseSync();

const { filePath, realm, env, concurrency, auto, totp } = argv;

const targetAdminClient = getAdminClient() as Promise<KeycloakAdminClient>

const csvFile = fs.readFileSync(filePath)


//NOTE: 'username' is backend username, i.e. '3w45tvtahna7mx9qe6gzp8dhsaitnigt@azureidir'
//      'idir_username' is the short-form username, i.e. 'tuser' for someone named Test User

const userList = parse( csvFile,
  {
    delimiter: ",",
    columns: ["username","email","lastName","firstName","idir_username"],

  }
)

console.log(userList)




async function pushUsers(
  targetAdminClient: KeycloakAdminClient,
  userList: [{
    username: string,
    email: string,
    lastName: string,
    firstName: string,
    idir_username: string
  }]
) {
  let userCount = 0

  for (const user of userList) {
    console.log("USER",user.idir_username)
    user.email = user.email.trim()

    let targetUsers = await targetAdminClient.users.find({
      realm: realm,
      username: user.username,
      exact: true
    }) as UserRepresentation[]

    //idirLookupResults does not appear to work with @azureidir accounts
    //let idirLookupResults = await fetchIdirUser({ property: 'userId', matchKey: user.username, env })

    let details;

    if (targetUsers.length > 0) {
      details = targetUsers[0] as UserRepresentation
      details.email = user.email.length>0 ? user.email : details.email
      details.lastName = user.lastName.length>0 ? user.lastName : details.lastName
      details.firstName = user.firstName.length>0 ? user.firstName : details.firstName
      details.attributes = details.attributes ? details.attributes : {}
      details.attributes.idir_username = user.idir_username.length>0 ? user.idir_username : details.attributes.idir_username

    }
    else {
      console.log("Generating details for", user.email)
      details = {
        guid: null,
        userId: null,
        displayName: null,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        attributes: {
          display_name: null,
          idir_user_guid: null,
          idir_username: user.idir_username
        }
      }
    }


    console.log(details);



    if (targetUsers.length === 0) {
      console.log("Adding user", user.email)
      const newuser = await targetAdminClient.users.create({
        enabled: true,
        realm: realm,
        username: user.username,
        email: details.email,
        firstName: details.firstName,
        lastName: details.lastName,
        attributes: {
          display_name: details.attributes?.display_name,
          idir_user_guid: details.attributes?.idir_user_guid,
          idir_username: details.attributes?.idir_username
        },
      });

      const lowerGuid = _.toLower(details.username);

      await targetAdminClient.users.addToFederatedIdentity({
        realm: realm,
        id: newuser.id,
        federatedIdentityId: 'azureidir',
        federatedIdentity: {
          userId: lowerGuid,
          userName: lowerGuid,
          identityProvider: 'azureidir',
        },
      });

      console.log("Added user",user.email)
    }
    else {
      console.log("Updating user", user.email)
      await targetAdminClient.users.update({ id: details.id as string, realm: realm},{
        email: details.email,
        firstName: details.firstName,
        lastName: details.lastName,
        attributes: {
          display_name: details.attributes?.display_name,
          idir_user_guid: details.attributes?.idir_user_guid,
          idir_username: details.attributes?.idir_username
        },
      })
      console.log("Updated user", user.email)
    }
  }
}

targetAdminClient.then(
  (client) => {
    pushUsers(client, userList)
  }
)
