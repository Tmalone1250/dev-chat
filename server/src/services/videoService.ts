import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

const client = twilio(accountSid, authToken);

interface TokenResponse {
  token: string;
  roomName: string;
}

export const generateToken = async (
  userId: string,
  channelId: string
): Promise<TokenResponse> => {
  try {
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    // Create Video Grant
    const videoGrant = new VideoGrant({
      room: channelId,
    });

    // Create Access Token
    const token = new AccessToken(
      accountSid!,
      apiKey!,
      apiSecret!,
      { identity: userId }
    );

    // Add grant to token
    token.addGrant(videoGrant);

    return {
      token: token.toJwt(),
      roomName: channelId,
    };
  } catch (error) {
    console.error('Error generating video token:', error);
    throw new Error('Failed to generate video token');
  }
};

export const createRoom = async (channelId: string) => {
  try {
    const room = await client.video.rooms.create({
      uniqueName: channelId,
      type: 'group',
      recordParticipantsOnConnect: false,
    });

    return room;
  } catch (error) {
    console.error('Error creating video room:', error);
    throw new Error('Failed to create video room');
  }
};

export const endRoom = async (channelId: string) => {
  try {
    const room = await client.video.rooms(channelId).update({
      status: 'completed',
    });

    return room;
  } catch (error) {
    console.error('Error ending video room:', error);
    throw new Error('Failed to end video room');
  }
};

export const getRoomParticipants = async (channelId: string) => {
  try {
    const participants = await client.video
      .rooms(channelId)
      .participants.list();

    return participants;
  } catch (error) {
    console.error('Error getting room participants:', error);
    throw new Error('Failed to get room participants');
  }
};

export const removeParticipant = async (
  channelId: string,
  participantSid: string
) => {
  try {
    await client.video
      .rooms(channelId)
      .participants(participantSid)
      .update({ status: 'disconnected' });
  } catch (error) {
    console.error('Error removing participant:', error);
    throw new Error('Failed to remove participant');
  }
};
