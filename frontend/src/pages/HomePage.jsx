import { SignedIn, SignedOut, SignIn, SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react'
import React, { use } from 'react'
import toast from 'react-hot-toast'

function HomePage() {


  // fetch  some data without using react query / tanstack query

  
    // useEffect(() => {
    //   const getbooks = async () => 
    //  {
    //      setIsLoading(true)
    //     try {
  
    //       const res = await fetch(  '/api/books')
    //       const data = await res.json()
    //       setBooks(data)
    //     }
    //     catch (err) {
    //       setError(err.message)
    //     }
    //     finally {
    //       setIsLoading(false)
    //     }
  //   const [books, setBooks] = React.useState([])
  //   const [isLoading, setIsLoading] = React.useState(true)
  // cont [error, setError] = React.useState(null)
     
    // }
    // refetch data
    // when you focus on the window - it fetch the data immediately
    
    
  //   getbooks()
  // }
  // , []);


// ? important note : 

// with tanstack query / react query

  // const [data, isLoading,Error, refetch ,... ,...] = useQuery ( {
  //   qyeryFn : fetch ( '/api/books').then ( res => res.json() )
  // })

  //? this above code is just for the reference purpose only
   

      return (
   
    <>
   <button className="btn btn-secondary  " onClick={
    () => toast.success("this is a success toast ")
    }> click me </button>
   
   <SignedOut>
      <SignInButton mode="modal">
        <button className="btn btn-primary"> Sign In </button>
      </SignInButton>
  </SignedOut>


      <SignedIn>
        <SignOutButton />
      </SignedIn>

  <UserButton />



</>
  )
}

export default HomePage