import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { WEBADE_USERNAME,WEBADE_PASSWORD, WEBADE_URL } from '../config';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import { parse } from 'csv-parse/sync';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import { getAdminClient } from 'core';
import { fetchIdirUser } from 'helpers/webservice-idir';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { IDIR_USERNAME } from '../config';
import RoleRepresentation, { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { assignUserToRealmRole, buildRoleMappings, buildUserRolesMap, createTargetUserRoleBindings } from 'helpers/groups-roles-users';
import fetch from 'node-fetch';
import Response from 'node-fetch'
import { fail } from 'yargs';
import { Env } from 'core';

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

interface ClientRoleRepresentation {
  clientID: string,
  clientName: string,
  roleId: string,
  roleName: string
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

const targetAdminClient = getAdminClient(env as Env, {}) as Promise<KeycloakAdminClient>

console.log(filePath)

const csvFile = fs.readFileSync(filePath)


//NOTE: 'username' is backend username, i.e. '3w45tvtahna7mx9qe6gzp8dhsaitnigt@azureidir'
//      'idir_username' is the short-form username, i.e. 'tuser' for someone named Test User

const userList = parse( csvFile,
  {
    delimiter: ",",
    columns: ["idir_username","role_list"],

  }
)

async function getDetailsFromAccountName(accountName: string){

  try {
    let headers = {
        "Content-Type":  "application/json",
        "Authorization": "Basic " + Buffer.from(WEBADE_USERNAME + ":" + WEBADE_PASSWORD, 'binary').toString('base64')
    };

    let response = await fetch(WEBADE_URL + "/usertypes/GOV/users?accountName=" + accountName, {"method": "GET", "headers": headers})

    let responseJson = await response.json() as any

    let details = {
      userGuid: responseJson.users[0].userGuid,
      accountName: accountName,
      firstName: responseJson.users[0].firstName,
      lastName: responseJson.users[0].lastName
    }

    return details
  }
  catch(err) {
    throw err
  }

}


async function pushUsers(
  targetAdminClient: KeycloakAdminClient,
  userList: [{
    idir_username: string,
    role_list: string
  }],
  userIdList: string[]
) {
  let userCount = 0

  console.log(userList)

  for (const user of userList) {

    let webadeDetails: {
      userGuid: any;
      accountName: string;
      firstName: any;
      lastName: any;
    }

    try {
      webadeDetails = await getDetailsFromAccountName(user.idir_username)
      console.log(webadeDetails)
    }
    catch(err) {
      console.error("Could not process user " + user.idir_username + "! Please verify account type")
      userIdList.push("")
      continue
    }

    let targetUsers = await  targetAdminClient.users.find({
      realm: realm,
      username: webadeDetails.userGuid + "@azureidir",
      exact: true
    }) as UserRepresentation[]
    //idirLookupResults does not appear to work with @azureidir accounts


    let details;

    if (targetUsers.length > 0) {
      userIdList.push(targetUsers[0].id as string)
      details = targetUsers[0] as any
      details.username = webadeDetails.userGuid + "@azureidir"
      details.lastName = webadeDetails.lastName.length>0 ? webadeDetails.lastName : details.lastName
      details.firstName = webadeDetails.firstName.length>0 ? webadeDetails.firstName : details.firstName
      details.attributes = details.attributes ? details.attributes : {}
      details.attributes.idir_username = user.idir_username.length>0 ? user.idir_username : details.attributes.idir_username

    }
    else {
      details = {
        guid: webadeDetails.userGuid,
        username: webadeDetails.userGuid + "@azureidir",
        displayName: null,
        email: null,
        firstName: webadeDetails.firstName,
        lastName: webadeDetails.lastName,
        attributes: {
          display_name: null,
          idir_user_guid: webadeDetails.userGuid,
          idir_username: user.idir_username
        }
      }
    }


    if (targetUsers.length === 0) {
      const newuser = await targetAdminClient.users.create({
        enabled: true,
        realm: realm,
        username: details.username,
        firstName: details.firstName,
        lastName: details.lastName,
        attributes: {
          display_name: details.attributes?.display_name,
          idir_user_guid: details.attributes?.idir_user_guid,
          idir_username: details.attributes?.idir_username
        },
      });

      userIdList.push(newuser.id as string)

      const lowerUsername = _.toLower(details.username);

      await targetAdminClient.users.addToFederatedIdentity({
        realm: realm,
        id: newuser.id,
        federatedIdentityId: 'azureidir',
        federatedIdentity: {
          userId: lowerUsername,
          userName: lowerUsername
        },
      }).then(() => console.log("userid:",lowerUsername));

      console.log("Added user",webadeDetails.accountName)
    }
    else {
      await targetAdminClient.users.update({ id: details.id as string, realm: realm},{
        firstName: details.firstName,
        lastName: details.lastName,
        attributes: {
          display_name: details.attributes?.display_name,
          idir_user_guid: details.attributes?.idir_user_guid,
          idir_username: details.attributes?.idir_username
        },
      })

      const lowerUsername = _.toLower(details.username);

      try {
        await targetAdminClient.users.delFromFederatedIdentity({
          realm: realm,
          id: details.id as string,
          federatedIdentityId: 'azureidir'
        })
      }
      catch(err) {
        console.warn("Del from federatedIdentity failed")
      }

      await targetAdminClient.users.addToFederatedIdentity({
          realm: realm,
          id: (details as UserRepresentation).id as string,
          federatedIdentityId: 'azureidir',
          federatedIdentity: {
            userId: lowerUsername,
            userName: lowerUsername
          },
        })


    }
  }

  return userIdList
}

async function mapUserRoles(
  targetAdminClient: KeycloakAdminClient,
  userIdList: string[],
  userList: [{
    idir_username: string
    role_list: string
  }]
) {





  let rolesMap = await buildRoleMappings(targetAdminClient, {realm: realm, excludes: []})

  let userRoleMap = await buildUserRolesMap(targetAdminClient, {realm: realm, roleMappings: rolesMap})

  let roleArray: ClientRoleRepresentation[] = []

  let clientList = await targetAdminClient.clients.find()

  let failedRoleNames: string[] = []


  for(const client of clientList) {
    if (client.id) {
      const roles = await targetAdminClient.clients.listRoles({id: client.id, realm: realm})

      roles.forEach((role) => {
        roleArray.push( {
          clientID: client.id as string,
          clientName: client.clientId as string,
          roleId: role.id as string,
          roleName: role.name as string
        })
      })

    }
  }


  let index = 0

  for (const user of userList) {

    if(userIdList[index] == "") {
      console.warn("skipping user", user.idir_username)
      index++
      continue
    }


    let clientRoleList = user.role_list.split(";")
    let userId = userIdList[index]

    for (const clientRole of clientRoleList) {
      const client = clientRole.split(":")[0]
      const roleName = clientRole.split(":")[1]

      try {
      let filteredRole = roleArray.filter((entry) => {
        return (entry.clientName == client && entry.roleName == roleName)
      })[0]

      const payload: RoleMappingPayload = { id: filteredRole.roleId as string, name: filteredRole.roleName}

      await targetAdminClient.users.addClientRoleMappings( {
        id: userId,
        clientUniqueId: filteredRole.clientID,
        roles: [payload],
        realm: realm
      })
    }
    catch(err) {
      failedRoleNames.push( client + ":" + roleName )
    }
    }

    index++
  }
  console.log("failed roles are as follows")
  failedRoleNames.forEach(failedRole => console.log(failedRole))
}

targetAdminClient.then(
  (client) => {
    let emptyUserIdList: string[] = []
    pushUsers(client, userList, emptyUserIdList).then((filledUserIdList) => {
      mapUserRoles(client, filledUserIdList, userList)
      }
    )

  }
)
