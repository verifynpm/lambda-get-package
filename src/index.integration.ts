import { expect } from 'chai';

import { getHashes } from '.';

describe('getHashes', () => {
  it('returns an undefined name when package does not exist', async () => {
    // ARRANGE
    const name = 'fkjfhlkajdfhlkasjfhklasdhf';
    const version = 'latest';

    // ACT
    const result = await getHashes(name, version);

    // ASSERT
    expect(result.name).to.not.be.ok;
  });

  it('returns an undefined version when package version cannot be resolved', async () => {
    // ARRANGE
    const name = 'express';
    const version = 'sjdfhlkasjhlakdsjfads';

    // ACT
    const result = await getHashes(name, version);

    // ASSERT
    expect(result.name).to.be.ok;
    expect(result.version).to.not.be.ok;
  });

  it('resolves dist tags', async () => {
    // ARRANGE
    const name = 'express';
    const version = 'latest';

    // ACT
    const result = await getHashes(name, version);

    // ASSERT
    expect(result.name).to.be.ok;
    expect(result.version).to.be.ok;
  });

  it('resolves partial version', async () => {
    // ARRANGE
    const name = 'express';
    const version = '4';

    // ACT
    const result = await getHashes(name, version);

    // ASSERT
    expect(result.name).to.be.ok;
    expect(result.version).to.be.ok;
  });
});
