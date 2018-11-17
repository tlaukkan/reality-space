import {expect} from 'chai';

import {AccessController} from "../../../src/node/storage/AccessController";
import {PrivilegeType} from "../../../src/node/storage/PrivilegeType";

describe('Access controller test.', () => {

    it('should test access controller', () => {
        const controller = new AccessController();

        const sid = "test";

        // TEST GROUP PRIVILEGES
        const administrators = "administrators";
        const administrator = "1";

        const modifiers = "modifiers";
        const modifier = "2";

        const users = "users";
        const user = "3";

        const viewers = "viewers";
        const viewer = "4";

        const noners = "noners";
        const noner = "5";

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

        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.ADMIN)).true;
        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(user, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(noner, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(noner, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(noner, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(noner, sid, PrivilegeType.VIEW)).false;

        // TEST USER PRIVILEGES
        const user2 = "6";
        controller.addUser(user2, "user2");
        controller.setUserPrivilege(user2, PrivilegeType.USE, sid);
        expect(controller.hasPrivilege(user2, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user2, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user2, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(user2, sid, PrivilegeType.VIEW)).true;

        // TEST GROUP REMOVAL
        expect(controller.getUser(user).groupNames.size).equals(1);
        controller.removeGroup(users);
        expect(controller.hasPrivilege(user, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.VIEW)).false;
        expect(controller.getUser(user).groupNames.size).equals(0);

        // TEST ACCESS MODEL SERIALIZATION
        const serializeModel = controller.serializeModel();
        const accessModel = controller.deserializeModel(serializeModel);
        controller.model = accessModel;

        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.ADMIN)).true;
        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(administrator, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.MODIFY)).true;
        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(modifier, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(user, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(user, sid, PrivilegeType.VIEW)).false;

        expect(controller.hasPrivilege(user2, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(user2, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(user2, sid, PrivilegeType.USE)).true;
        expect(controller.hasPrivilege(user2, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(viewer, sid, PrivilegeType.VIEW)).true;

        expect(controller.hasPrivilege(noner, sid, PrivilegeType.ADMIN)).false;
        expect(controller.hasPrivilege(noner, sid, PrivilegeType.MODIFY)).false;
        expect(controller.hasPrivilege(noner, sid, PrivilegeType.USE)).false;
        expect(controller.hasPrivilege(noner, sid, PrivilegeType.VIEW)).false;

        // TEST USER REMOVAL
        expect(controller.getGroup(modifiers).userIds.size).equals(1);
        controller.removeUser(modifier);
        expect(controller.getGroup(modifiers).userIds.size).equals(0);
    });


});