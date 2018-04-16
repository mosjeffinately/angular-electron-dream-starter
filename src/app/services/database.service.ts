import { Injectable } from '@angular/core';

// import typings.
import * as RxDBTypes from '../typings/RxDB.d';

import RxDB from 'rxdb/plugins/core';

import RxDBErrorMessagesModule from 'rxdb/plugins/error-messages';
import RxDBSchemaCheckModule from 'rxdb/plugins/schema-check';
if( ENV == 'development' ) {
    // schema-checks should only be used in development mode.
    RxDB.plugin(RxDBSchemaCheckModule);
}

import EncryptionPlugin from 'rxdb/plugins/encryption';
RxDB.plugin(EncryptionPlugin);

import KeycompressionPlugin from 'rxdb/plugins/key-compression';
RxDB.plugin(KeycompressionPlugin);

import RxDBValidateModule from 'rxdb/plugins/validate';
RxDB.plugin(RxDBValidateModule);

import RxDBLeaderElectionModule from 'rxdb/plugins/leader-election';
RxDB.plugin(RxDBLeaderElectionModule);

import AttachmentsPlugin from 'rxdb/plugins/attachments';
RxDB.plugin(AttachmentsPlugin);

RxDB.QueryChangeDetector.enable();
RxDB.QueryChangeDetector.enableDebugging();

const adapters = {
    idb: require('pouchdb-adapter-idb')
};

const useAdapter = 'idb';
RxDB.plugin(adapters[useAdapter]);

let collections = [
    {
        name: 'users',
        schema: require('../schemas/user.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; }
        }
    },
    {
        name: 'courses',
        schema: require('../schemas/course.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; }
        }
    },
    {
        name: 'systemannouncements',
        schema: require('../schemas/system-announcement.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; },
            2: (oldDoc) => { return null; }
        }
    },
    {
        name: 'courseannouncements',
        schema: require('../schemas/course-announcement.schema.json')
    },
    {
        name: 'contents',
        schema: require('../schemas/content.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; },
            2: (oldDoc) => { return null; },
            3: (oldDoc) => { return null; },
            4: (oldDoc) => { return null; },
            5: (oldDoc) => { return null; }
        }
    },
    {
        name: 'attachments',
        schema: require('../schemas/attachment.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; },
            2: (oldDoc) => { return null; },
            3: (oldDoc) => { return null; },
            4: (oldDoc) => { return null; }
        }
    },
    {
        name: 'assignments',
        schema: require('../schemas/assignment.schema.json')
    },
    {
        name: 'assignmentsubmissions',
        schema: require('../schemas/assignment-submission.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; },
            2: (oldDoc) => { return null; },
            3: (oldDoc) => { return null; },
            4: (oldDoc) => { return null; }
        }
    },
    {
        name: 'discussions',
        schema: require('../schemas/discussion-board.schema.json')
    },
    {
        name: 'forums',
        schema: require('../schemas/discussion-forum.schema.json')
    },
    {
        name: 'threads',
        schema: require('../schemas/discussion-thread.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; }
        }
    },
    {
        name: 'posts',
        schema: require('../schemas/discussion-post.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; },
            2: (oldDoc) => { return null; }
        }
    },
    {
        name: 'forumlink',
        schema: require('../schemas/forum-link.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; }
        }
    },
    {
        name: 'system',
        schema: require('../schemas/system.schema.json'),
        migrationStrategies: {
            1: (oldDoc) => { return null; },
            2: (oldDoc) => { return null; }
        }
    }
];

@Injectable()
export class DatabaseService {
    static dbPromise: Promise<RxDBTypes.RxOfflineDatabase> = null;
    private async _create(): Promise<any> {
        console.debug('DatabaseService: Creating database...');
        const db = await RxDB.create({
            name: 'bboffline',
            adapter: useAdapter,
            password: 'y1WkE1wUsJ'
        });

        console.debug('DatabaseService: Created database.');
        window['db'] = db; // write to window for debugging.

        // show leadership in title.
        db.waitForLeadership()
        .then(() => {
            console.debug('isLeader now.');
            document.title = document.title;
        })

        // create collections
        console.debug('DatabaseService: create collections...');
        await Promise.all( collections.map( colData => db.collection(colData) ) );

        return db;
    }

    get(): Promise<RxDBTypes.RxOfflineDatabase> {
        if( DatabaseService.dbPromise ) {
            return DatabaseService.dbPromise;
        }

        // create database.
        DatabaseService.dbPromise = this._create();
        return DatabaseService.dbPromise;
    }
}