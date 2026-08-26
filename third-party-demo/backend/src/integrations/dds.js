import { DDSAuth } from 'dds-auth-zogoal/server'

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID || '',
  clientSecret: process.env.DDS_CLIENT_SECRET || '',
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
})

export default dds
