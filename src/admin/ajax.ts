import axios from 'axios' //  axios主要是用于向后台发起请求的。前端项目中引入axios
type IAjax<T> = (url: string) => (body?: T, other?: string) => Promise<any>

export const ajax: {
  //  封装了请求方法
  Catch: (e: any) => void
  api: string
  get: IAjax<string>
  post: IAjax<{ [x: string]: any }>
  delete: IAjax<string>
  put: IAjax<{ [x: string]: any }>
} = {
  Catch: e => {
    location.href = 'login.html'
  },
  api: '/admin_api',
  get(url) {
    return body =>
      new Promise(resolve =>
        axios
          .get(this.api + url + '?' + (body || ''))
          .then(({ data }) => resolve(data))
          .catch(this.Catch)
      )
  },
  delete(url) {
    return body =>
      new Promise(resolve =>
        axios
          .delete(this.api + url + '?' + (body || ''))
          .then(({ data }) => resolve(data))
          .catch(this.Catch)
      )
  },
  post(url) {
    return (body, query) =>
      new Promise(resolve =>
        axios
          .post(this.api + url + '?' + (query || ''), body)
          .then(({ data }) => resolve(data))
          .catch(this.Catch)
      )
  },
  put(url) {
    return body =>
      new Promise(resolve =>
        axios
          .put(this.api + url, body)
          .then(({ data }) => resolve(data))
          .catch(this.Catch)
      )
  },
}
