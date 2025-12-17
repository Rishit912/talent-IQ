import axios from 'axios';

const  axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ,  // whenever we make a request using this axios instance , this base url will be prefixed to the request url
    withCredentials : true  // when we set this to true , cookies are sent along with every single request

})

export default axiosInstance;