import {expect} from 'chai';

import {AccessController} from "../../../../src/node/storage/AccessController";
import {PrivilegeType} from "../../../../src/node/storage/model/PrivilegeType";
import {Principal} from "../../../../src/node/http/Principal";

describe('Access controller test.', () => {

    it('should test access controller', () => {
        const controller = new AccessController();

        const sid = "test";

        // TEST GROUP PRIVILEGES
        const administrators = "administrators";
        const administrator = "1";
        const administratorPrincipal = new Principal("", "", "", administrator, "administrator", undefined);

        const modifiers = "modifiers";
        const modifier = "2";
        const modifierPrincipal = new Principal("", "", "", modifier, "modifier", undefined);

        const users = "users";
        const user = "3";
        const userPrincipal = new Principal("", "", "", user, "user", undefined);

        const viewers = "viewers";
        const viewer = "4";
        const viewerPrincipal = new Principal("", "", "", viewer, "viewer", undefined);

        const noners = "noners";
        const noner = "5";
        const nonerPrincipal = new Principal("", "", "", noner, "noner", undefined);

        controller.addGroup(administrators);
        controller.addUser(administrator, "administrator");
        controller.addGroupMember(administrators, administrator);
        controller.setGroupPrivilege(administrators, PrivilegeType.ADMIN, sid);

        controller.addGroup(modifiers);
        controller.addUser(modifier, "modifier");
        controller.addGroupMember(modifiers, modifier);
        controller.setGroupPrivilege(modifiers, PrivilegeType.MODIFY, sid);

        controller.addGroup(users);
        controller.addUser(user, "user");
        controller.addGroupMember(users, user);
        controller.setGroupPrivilege(users, PrivilegeType.USE, sid);

        controller.addGroup(viewers);
        controller.addUser(viewer, "viewer");
        controller.addGroupMember(viewers, viewer);
        controller.setGroupPrivilege(viewers, PrivilegeType.VIEW, sid);

        controller.addGroup(noners);
        controller.addUser(noner, "noner");
        controller.addGroupMember(noners, noner);

        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.ADMIN)).true;
        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.VIEW)).false;

        // TEST USER PRIVILEGES
        const user2 = "6";
        controller.addUser(user2, "user2");
        controller.setUserPrivilege(user2, PrivilegeType.USE, sid);
        const user2Principal = new Principal("", "", "", user2, "user2", undefined);

        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.VIEW)).true;

        // TEST GROUP REMOVAL
        expect(controller.getUser(user).groupNames.size).equals(1);
        controller.removeGroup(users);
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.VIEW)).false;
        expect(controller.getUser(user).groupNames.size).equals(0);

        // TEST ACCESS MODEL SERIALIZATION
        const serializeModel = controller.serialize();
        controller.deserialize(serializeModel);

        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.ADMIN)).true;
        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(administratorPrincipal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(modifierPrincipal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(userPrincipal, sid, PrivilegeType.VIEW)).false;

        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(user2Principal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(viewerPrincipal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(nonerPrincipal, sid, PrivilegeType.VIEW)).false;

        // TEST USER REMOVAL
        expect(controller.getGroup(modifiers).userIds.size).equals(1);
        controller.removeUser(modifier);
        expect(controller.getGroup(modifiers).userIds.size).equals(0);


        // Test principal groups based access

        const administrator2Principal = new Principal("", "", "", "7", "administrator2", ["administrators"]);
        const modifier2Principal = new Principal("", "", "", "8", "modifier", ["modifiers"]);
        const user3Principal = new Principal("", "", "", "9", "user", ["users"]);
        const viewer2Principal = new Principal("", "", "", "10", "viewer", ["viewers"]);
        const noner2Principal = new Principal("", "", "", "11", "noner", ["noners"]);

        expect(controller.hasPrivilege(administrator2Principal, sid, PrivilegeType.ADMIN)).true;
        expect(controller.hasPrivilege(administrator2Principal, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(administrator2Principal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(administrator2Principal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(modifier2Principal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(modifier2Principal, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(modifier2Principal, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(modifier2Principal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(user3Principal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user3Principal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user3Principal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(user3Principal, sid, PrivilegeType.VIEW)).false;

        expect(controller.hasPrivilege(viewer2Principal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(viewer2Principal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(viewer2Principal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(viewer2Principal, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(noner2Principal, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(noner2Principal, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(noner2Principal, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(noner2Principal, sid, PrivilegeType.VIEW)).false;
    });


});