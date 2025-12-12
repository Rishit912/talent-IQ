import './App.css'
import { SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

function App() {

  return (
    <>
      <h1>welcome to the app</h1>

      <SignedOut>
            <SignInButton  mode='modal' />
      </SignedOut>

      <SignInButton>
        <SignedOut />
      </SignInButton>

      <UserButton />
     
    </>
  )
}

export default App
