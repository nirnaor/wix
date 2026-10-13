// @vitest-environment node

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadWixStoresV1Config } from '../lib/config-loader.js';

describe('loadWixStoresV1Config', () => {
    let projectRoot: string;

    beforeEach(() => {
        projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wix-stores-v1-config-'));
    });

    afterEach(() => {
        fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    function writeConfig(content: string) {
        fs.mkdirSync(path.join(projectRoot, 'config'), { recursive: true });
        fs.writeFileSync(path.join(projectRoot, 'config', '.wix-stores-v1.yaml'), content);
    }

    it('reads locale and productOrder from config/.wix-stores-v1.yaml', () => {
        writeConfig(
            [
                "locale: 'he-il'",
                'productOrder:',
                '  - "i-m-a-product"',
                '  - "i-m-a-product-1"',
                '',
            ].join('\n'),
        );
        expect(loadWixStoresV1Config(projectRoot)).toEqual({
            locale: 'he-il',
            productOrder: ['i-m-a-product', 'i-m-a-product-1'],
            collectionOrder: {},
        });
    });

    it('returns the defaults when the file is missing', () => {
        expect(loadWixStoresV1Config(projectRoot)).toEqual({
            locale: null,
            productOrder: [],
            collectionOrder: {},
        });
    });

    it('returns the defaults for an empty file, and ignores values of the wrong type', () => {
        writeConfig('');
        expect(loadWixStoresV1Config(projectRoot)).toEqual({
            locale: null,
            productOrder: [],
            collectionOrder: {},
        });

        writeConfig('locale: 42\nproductOrder:\n  - shoes\n  - 7\n  - glasses\n');
        expect(loadWixStoresV1Config(projectRoot)).toEqual({
            locale: null,
            productOrder: ['shoes', 'glasses'],
            collectionOrder: {},
        });
    });

    it('reads the order of each collection, keeping only slugs', () => {
        writeConfig(
            [
                'collectionOrder:',
                '  "0d655635-6211-9dd1-44f5-9a749c878498":',
                '    - cuddloo-top',
                '    - 7',
                '    - oversized-fluff-tee',
                '  "c-2": nope',
                '',
            ].join('\n'),
        );
        expect(loadWixStoresV1Config(projectRoot).collectionOrder).toEqual({
            '0d655635-6211-9dd1-44f5-9a749c878498': ['cuddloo-top', 'oversized-fluff-tee'],
            'c-2': [],
        });
    });
});
