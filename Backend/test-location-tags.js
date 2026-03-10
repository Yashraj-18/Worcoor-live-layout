import { LocationTagsService } from './src/modules/warehouse/location-tags/service.js';

const mockRequest = {
  params: { unitId: '4f4f0c17-f77a-4c0c-aacc-a2576461529b' },
  user: { organizationId: '8bff5496-b58f-44c5-bb78-7e4a5bf79b2d' }
};

const mockReply = {
  send: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
};

async function testLocationTags() {
  console.log('Testing location-tags endpoint...');
  const service = new LocationTagsService();
  await service.list(mockRequest, mockReply);
}

testLocationTags().catch(console.error);
