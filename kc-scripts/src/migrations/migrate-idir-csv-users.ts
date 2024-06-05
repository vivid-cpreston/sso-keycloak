import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { WEBADE_USERNAME,WEBADE_PASSWORD, WEBADE_URL } from 'config';
import * as csv from '@fast-csv/format';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import { parse } from 'csv-parse/sync';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import { getAdminClient } from 'core';
import { fetchIdirUser } from 'helpers/webservice-idir';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { IDIR_USERNAME } from 'config';
import RoleRepresentation, { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { assignUserToRealmRole, buildRoleMappings, buildUserRolesMap, createTargetUserRoleBindings } from 'helpers/groups-roles-users';
import fetch from 'node-fetch';
import Response from 'node-fetch'


const basePath = path.join(__dirname, 'exports');


interface RoleMapping {
  type: string;
  id: string;
  name: string;
  children: string[];
  group?: any;
  role?: any;
}

interface UserRoleMap {
  [key: string]: UserRepresentation & { roles: string[] };
}
interface RolesByName {
  [key: string]: RoleRepresentation;
}

interface userResponse {
  "@type": string,
  links: []
  users: [ {
    accountName: string,
    firstName: string,
    lastName: string,
    userGuid: string
    }
  ]
}

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
    columns: ["idir_username","role_list"],

  }
)

console.log(userList)


async function getDetailsFromAccountName(accountName: string){

  console.log("entered getDetailsFromAccountName")

  try {
    let headers = {
        "Content-Type":  "application/json",
        "Authorization": "Basic " + Buffer.from(WEBADE_USERNAME + ":" + WEBADE_PASSWORD, 'binary').toString('base64')
    };

    console.log(headers)

    console.log(">>> URL is ", WEBADE_URL + "/usertypes/GOV/users?accountName=" + accountName)

    let response = await fetch(WEBADE_URL + "/usertypes/GOV/users?accountName=" + accountName, {"method": "GET", "headers": headers})

    console.log(">>> response is ", response)

    let responseJson = await response.json() as userResponse



    console.log(">>> Response data is ",response)
    let details = {
      userGuid: responseJson.users[0].userGuid,
      accountName: accountName,
      firstName: responseJson.users[0].firstName,
      lastName: responseJson.users[0].lastName
    }

    return details
  }
  catch(err) {
    console.error(">>> Error is",err)
    throw err
  }

}


async function pushUsers(
  targetAdminClient: KeycloakAdminClient,
  userList: [{
    idir_username: string,
    role_list: string
  }]
) {
  let userCount = 0

  for (const user of userList) {
    console.log("USER",user.idir_username)

  let webadeDetails = await getDetailsFromAccountName(user.idir_username)


    console.log("Webade Details are:",webadeDetails)

    let targetUsers = await targetAdminClient.users.find({
      realm: realm,
      username: webadeDetails.userGuid + "@azureidir",
      exact: true
    }) as UserRepresentation[]

    //idirLookupResults does not appear to work with @azureidir accounts


    let details;

    if (targetUsers.length > 0) {
      details = targetUsers[0] as UserRepresentation
      details.username = webadeDetails.userGuid + "@azureidir"
      details.lastName = webadeDetails.lastName.length>0 ? webadeDetails.lastName : details.lastName
      details.firstName = webadeDetails.firstName.length>0 ? webadeDetails.firstName : details.firstName
      details.attributes = details.attributes ? details.attributes : {}
      details.attributes.idir_username = user.idir_username.length>0 ? user.idir_username : details.attributes.idir_username

    }
    else {
      console.log("Generating details for", user.idir_username)
      details = {
        guid: null,
        userId: webadeDetails.userGuid + "@azureidir" ,
        displayName: null,
        email: null,
        firstName: webadeDetails.firstName,
        lastName: webadeDetails.lastName,
        attributes: {
          display_name: null,
          idir_user_guid: null,
          idir_username: user.idir_username
        }
      }
    }


    console.log(details);



    if (targetUsers.length === 0) {
      console.log("Adding user", user.idir_username)
      const newuser = await targetAdminClient.users.create({
        enabled: true,
        realm: realm,
        username: webadeDetails + "@azureidir",
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

      console.log("Added user",webadeDetails.accountName)
    }
    else {
      console.log("Updating user", webadeDetails.accountName)
      await targetAdminClient.users.update({ id: details.id as string, realm: realm},{
        firstName: details.firstName,
        lastName: details.lastName,
        attributes: {
          display_name: details.attributes?.display_name,
          idir_user_guid: details.attributes?.idir_user_guid,
          idir_username: details.attributes?.idir_username
        },
      })
      console.log("Updated user", webadeDetails.accountName)
    }
  }
}

async function mapUserRoles(
  targetAdminClient: KeycloakAdminClient,
  userList: [{
    username: string,
    idir_username: string
    client_list: string
  }]
) {


  let rolesMap = await buildRoleMappings(targetAdminClient, {realm: env, excludes: []})

  let userRoleMap = await buildUserRolesMap(targetAdminClient, {realm: env, roleMappings: rolesMap})

  for (const user of userList) {





    let clientRoleList = user.client_list.split(";")

    for (const clientRole of clientRoleList) {
      const client = clientRole.split(":")[0]
      const roleName = clientRole.split(":")[1]

      const roleMapping = {
        realm,
        id: user.username,
        clientUniqueId: client,
      };

      let role = await targetAdminClient.clients.findRole({
        realm: env,
        id: client,
        roleName: roleName
      })


      const payload: RoleMappingPayload = { id: role.id as string, name: roleName}

      targetAdminClient.users.addClientRoleMappings( {
        id: user.username,
        clientUniqueId: clientRole.split(":")[0],
        roles: [payload],
        realm: env
      })
    }


  }
}

targetAdminClient.then(
  (client) => {
    pushUsers(client, userList)
    mapUserRoles(client, userList)
  }
)
