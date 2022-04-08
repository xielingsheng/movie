import { Button, Card, DatePicker, message, Select } from 'antd'
import React from 'react'
import { useRequest } from 'ahooks'
import { ajax } from './ajax'
import './HallList.less'
import moment from 'moment'
const colorList = ['magenta', 'red', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple']
const formatTime = (start: number) =>
  `${String(Math.floor(start / 60) % 24).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}` //  Math.floor向下取整
const filmMap = new Map<
  number,
  {
    fName: string
    fid: number
    filmlong: number
    price: number
    rank: number
  }
>()
interface IProp {}
type IPlay = { pid: number; fid: number; time: number; hid: number }
const HallList: React.FC<IProp> = () => {
  const dateFormat = 'YYYY-MM-DD' // 定义日期输出格式
  const [selectedCid, setCid] = React.useState<number>(0)
  const [selectedDate, setDate] = React.useState<string>(moment().format(dateFormat))
  const [playList, setPlayList] = React.useState<IPlay[]>([])

  const { data: hallInfo } = useRequest(ajax.get('/hall'), {
    onSuccess(res) {
      setCid((res[0] || {}).cid || 0)
    },
  })
  const { run: getPlay } = useRequest(ajax.get('/play'), {
    manual: true,
    onSuccess(res) {
      setPlayList(res)
    },
  })
  const { data: filmList } = useRequest(ajax.get('/filmBoxofficeTop10'), {
    onSuccess(data) {
      data.map(info => filmMap.set(info.fid, info))
    },
  })

  const { run: save } = useRequest(ajax.post('/play'), {
    manual: true,
    onSuccess() {
      getPlay(`cid=${selectedCid}&date=${selectedDate}`)
      message.success('保存成功')
    },
  })

  const { run: autoPlay } = useRequest(ajax.get('/autoPlay'), {
    manual: true,
    onSuccess(res) {
      setPlayList(res)
    },
  })

  React.useEffect(() => {
    if (!selectedCid) {
      return
    }
    getPlay(`cid=${selectedCid}&date=${selectedDate}`)
  }, [selectedCid, selectedDate])
  React.useEffect(() => {
    if (!filmList) {
      return
    }
    ;(document.getElementById('play') as any).onmousedown = ({ target, layerX, layerY, clientX, clientY }) => {
      if ([...(target?.classList || [])].indexOf('filmCard') < 0) {
        return
      } //  clientX    以浏览器左上顶角为原点，定位 x 轴坐标。layerX    最近的绝对定位的父元素（如果没有，则为Document对象）左上角为原点，定位x轴坐标
      const playMove = document.getElementById('playMove')
      const { style } = playMove
      const filmInfo = filmList[target.dataset.filmindex]

      playMove.innerHTML = target.innerHTML // 把源元素的html内容赋给playMove
      playMove.className = target.className // 源元素的className赋给playMove的classname
      const cardInfo: any = playMove.getElementsByClassName('info')[0] || {}
      style.cssText = target.style.cssText // playMove的css样式跟源元素的css样式一样
      style.left = '0'
      style.width = target.clientWidth + 'px'
      style.transform = `translate(${clientX - layerX}px, ${clientY - layerY}px)`
      const newPlay: IPlay = {
        pid: Number(target.dataset.pid ?? -Math.ceil(Math.random() * 100000)),
        fid: filmInfo.fid,
        time: 0,
        hid: 0,
      }
      if (target.dataset.pid) {
        target.style.display = 'none'
      }
      const playHallListInfo: {
        top: number
        left: number
        width: number
        height: number
        hid: number
        freeTime: number
      }[] = [...(document.getElementsByClassName('playHallList') as any)].map(
        ({ offsetTop, offsetLeft, clientWidth, clientHeight, dataset }) => ({
          top: offsetTop,
          left: offsetLeft,
          width: clientWidth,
          height: clientHeight,
          hid: Number(dataset.hid),
          freeTime: Number(dataset.capacity) / 2, //  间隔时间是影厅容量的一半
        })
      )
      const move = (playListMap: Map<number, IPlay>, freeTime: number) => {
        const newPlayEndTime = filmInfo.filmlong + freeTime + newPlay.time
        let pTime = 0
        ;[...playListMap.values()]
          .filter(({ pid, hid: oldHid }) => newPlay.hid === oldHid && pid !== newPlay.pid)
          .sort((a, b) => a.time - b.time)
          .forEach(({ time, fid, pid }) => {
            const filmlong = filmMap.get(fid).filmlong
            const nowTime = Math.max(time, pTime) //  返回给定的一组数中的最大值
            const endTime = nowTime + filmlong + freeTime //  结束时间=现在时间+电影时长+间隔时间
            if (time !== nowTime) {
              playListMap.get(pid).time = nowTime
            }
            // console.log(newPlay.time, endTime, newPlayEndTime, nowTime)
            if (newPlay.time > endTime || newPlayEndTime < nowTime) {
              pTime = Math.ceil(endTime / 5) * 5 //  Math.ceil()  “向上取整”， 即小数部分直接舍去
            } else {
              const newStartTime = Math.ceil(newPlayEndTime / 5) * 5
              playListMap.get(pid).time = newStartTime
              pTime = Math.ceil((newStartTime + filmlong + freeTime) / 5) * 5
            }
          })
      }
      window.onmousemove = e => {
        //  鼠标移动时将监听e（源元素的坐标变化）
        const playListMap = new Map<number, IPlay>()
        playList.map(({ pid, ...item }) => playListMap.set(pid, { pid, ...item }))
        let x = e.clientX - layerX //  电影卡片所在的真实x轴坐标是浏览器左上角原点x轴坐标-document对象左上角x轴坐标
        let y = e.clientY - layerY //  电影卡片所在的真实y轴坐标是浏览器左上角原点y轴坐标-document对象左上角y轴坐标
        cardInfo.style.display = 'none' //  起初电影卡片的显示没样式
        cardInfo.innerHTML = ''
        newPlay.hid = 0 //  定义起初新排片的hid为0
        playHallListInfo.some(({ top, height, left, width, hid, freeTime }) => {
          //  定义排片的时间轴轨道
          if (y > top - height / 2 && y < top + height / 2) {
            //  这里设置了轨道上下感应区，如果被拖动卡片的y轴坐标在轨道上下感应区了，那么卡片就吸上去了。此时电影卡片y轴坐标就是top的y轴坐标
            newPlay.hid = hid
            y = top
            const startTimeMins = Math.max(
              0,
              Math.min(Math.round((((x - left) / width) * 960) / 5) * 5, 960 - Math.ceil(filmInfo.filmlong / 5) * 5) //  math.round() 方法可把一个数字舍入为最接近的整数。math.ceil() 方法可对一个数进行上舍入。
            )
            x = left + (startTimeMins * width) / 960 //  此时电影卡片的x轴坐标就是
            cardInfo.style.display = 'block'
            cardInfo.innerHTML = `${formatTime(startTimeMins + 480)}-${formatTime(
              startTimeMins + 480 + filmInfo.filmlong
            )}`
            newPlay.time = 480 + startTimeMins
            move(playListMap, freeTime)
            return true
          }
        })
        setPlayList([...playListMap.values()])
        style.transform = `translate(${x}px, ${y}px)`
      }
      window.onmouseup = () => {
        //  onmouseup事件是在鼠标松开的时候触发onmouseup事件。
        window.onmousemove = null //  鼠标放开时，电影卡片样式消失
        window.onmouseup = null
        style.display = 'none' //  显示为无样式（电影卡片消失）
        const playListMap = new Map<number, IPlay>()
        playList.map(({ pid, ...item }) => playListMap.set(pid, { pid, ...item }))
        move(playListMap, playHallListInfo.find(({ hid }) => newPlay.hid === hid).freeTime)
        const newPlayList = [...playListMap.values()].filter(
          ({ pid, time, fid }) => pid !== newPlay.pid && time + filmMap.get(fid).filmlong - 480 <= 960
        )
        if (newPlay.hid) {
          newPlayList.push(newPlay)
        }
        setPlayList(newPlayList)
        target.style.display = 'block'
      }
    }
  }, [filmList, playList])

  return (
    <div id="play">
      <Card title="放映厅排片">
        <div id="filter" className="space-between">
          <div>
            <div style={{ width: '80px' }}>电影院：</div>
            <Select value={selectedCid} style={{ width: '90%' }} onChange={setCid}>
              {hallInfo?.map(({ cid, cName }, index) => (
                <Select.Option key={index} value={cid}>
                  {cName}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <div style={{ width: '80px' }}>日期：</div>
            <DatePicker
              allowClear={false}
              defaultValue={moment()} //  moment()不带参数表示默认当前日期（今天日期）
              style={{ width: '90%' }}
              onChange={e => {
                //  当选择的时间改变时，让新的时间格式设置成预定好的时间格式
                setDate(e.format(dateFormat)) // setDate()回调函数
              }}
            />
          </div>
          <div>
            <Button type="primary" onClick={() => autoPlay(`cid=${selectedCid}&date=${selectedDate}`)}>
              {/* 监听鼠标点击事件，触发autoplay事件 */}
              一键排期
            </Button>
          </div>
        </div>
        <div className="filmPool">
          {filmList?.map(({ fName, filmlong, rank }) => (
            <div
              key={rank}
              className={`ant-tag-${colorList[rank]} filmCard`}
              style={{ width: (filmlong / 960) * 100 + '%' }} // 时间轴长为960分钟，电影卡片宽度取决于电影时长/960时间横轴的占比百分几
              data-filmindex={rank} // 排名赋值给电影池的索引
            >
              <div className="pid">
                <div>{rank + 1}</div>
                <div>{filmlong}mins</div>
              </div>
              <div className="fName">{fName}</div>
              <div className="info" style={{ display: 'none' }} />
            </div>
          ))}
        </div>
      </Card>
      <Card
        style={{ marginTop: '20px', position: 'unset', overflow: 'hidden' }}
        title={
          <div className="space-between playTime">
            {Array(16) //  把时间轴分成16段填满，fill() 方法用于将一个固定值替换数组的元素。
              .fill(0)
              .map((_, index) => (
                <div key={index}>{index + 8}:00</div> // 电影时间轴从8点开始
              ))}
          </div>
        }
      >
        {(((hallInfo || []).find(({ cid }) => cid === selectedCid) || {}).halls || []).map(
          ({ capacity, hName, price, hid }) => (
            <div className="playHallList" key={hid} data-hid={hid} data-capacity={capacity}>
              <h1>
                {hName}（容量：{capacity}人，每次间隔至少{capacity / 2}分钟，票价浮动：{price * 10}%）
              </h1>
              {playList
                .filter(({ hid: playHid }) => hid === playHid)
                .map(({ pid, fid, time }) => {
                  const filmInfo = filmList.find(({ fid: findFid }) => fid === findFid)
                  const isDel = time + filmInfo.filmlong - 480 > 960 //  如果电影卡片的末尾超过了960分钟长度，则删除掉
                  return (
                    <div
                      key={pid}
                      className={`ant-tag-${colorList[filmInfo.rank]} filmCard`}
                      style={{
                        width: (filmInfo.filmlong / 960) * 100 + '%', //  电影卡片宽度等于电影时长/960*100%
                        left: ((time - 480) * 100) / 960 + '%', //  这是电影卡片左边的开始时刻。
                        filter: `grayscale(${Number(isDel)}00%)`,
                        opacity: isDel ? '0.6' : '1',
                      }}
                      data-filmindex={filmInfo.rank}
                      data-pid={pid}
                    >
                      <div className="pid">
                        <div>{pid < 0 ? 'New' : pid}</div>
                        <div>{filmInfo.filmlong}mins</div>
                      </div>
                      <div className="fName">{filmInfo.fName}</div>
                      <div className="info">
                        {formatTime(time)}-{formatTime(time + filmInfo.filmlong)}.
                      </div>
                    </div>
                  )
                })}
            </div>
          )
        )}
        <div style={{ width: '100%', textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={() => {
              save(playList, `cid=${selectedCid}&date=${selectedDate}`)
            }}
          >
            保存
          </Button>
        </div>
      </Card>
      <div id="playMove" />
    </div>
  )
}

export default HallList
