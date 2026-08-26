import prompts from 'prompts'

export async function promptForIntegrationScope(): Promise<'both' | 'frontend' | 'backend' | 'cancel'> {
  const response = await prompts({
    type: 'select',
    name: 'scope',
    message: 'What are you integrating DDS Auth into?',
    choices: [
      { title: 'Full Stack (React Frontend + Node/Express Backend)', value: 'both' },
      { title: 'Frontend Only (React Client)', value: 'frontend' },
      { title: 'Backend Only (Node.js / Express Server)', value: 'backend' },
      { title: 'Cancel Setup', value: 'cancel' }
    ],
    initial: 0
  })

  return response.scope || 'cancel'
}

export async function promptForConfirmation(message: string): Promise<boolean> {
  const response = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message,
    initial: true
  })

  return !!response.confirmed
}
