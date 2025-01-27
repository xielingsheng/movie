import React from 'react'
import { Col, Layout, Menu, Row, Space } from 'antd'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  VideoCameraOutlined,
  SolutionOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  PoweroffOutlined,
} from '@ant-design/icons' // 在前端定义枚举映射
import FilmList from './FilmList'
import HallList from './HallList'
import './app.less'
import OrderList from './OrderList'
import UserList from './UserList'
import Statistics from './Statistics'
const { Header, Sider, Content } = Layout
const menu: {
  name: string
  icon: React.ReactNode
  render: React.ReactNode //  对服务器下发的菜单数据进行转换,icon字段是React.ReactNode的类型  React.ReactNode是组件所有可能的返回值的集合(可以是 ReactElement, ReactFragment, string ，a number 或者一个数组 ReactNodes, 或者null,或者 undefined, 或者 boolean)
}[] = [
  {
    name: '影讯信息管理',
    icon: <UserOutlined />,
    render: <FilmList />,
  },
  {
    name: '放映厅排片',
    icon: <VideoCameraOutlined />,
    render: <HallList />,
  },
  {
    name: '订单信息管理',
    icon: <SolutionOutlined />,
    render: <OrderList />,
  },
  {
    name: '用户信息管理',
    icon: <InfoCircleOutlined />,
    render: <UserList />,
  },
  {
    name: '票房统计',
    icon: <BarChartOutlined />,
    render: <Statistics />,
  },
]
export default () => {
  const [collapsed, setCollapsed] = React.useState(false) // 改写成Hooks的写法。useState：组件状态管理的钩子      collapsed：管理组件的状态  setCollapsed：更新collapsed的方法，方法名不可更改！  false:初始的collapsed，可以是任意的数据类型,这里是布尔型
  const [page, setPage] = React.useState('4') // useState 就是一个 Hook。这里后台管理界面打开的是第5个模块（票房统计）

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        {/*使用自定义触发器，可以设置 trigger={null} 来隐藏默认设定，设置为 null 时隐藏 trigger。collapsible：是否可收起。collapsed：当前收起状态*/}
        <div className="logo">
          <span
            style={{
              textAlign: 'center',
              margin: '0 30px',
              fontSize: '18px',
              color: 'white',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.3s',
              opacity: collapsed ? 0 : 1,
            }}
          >
            后台管理系统
          </span>
        </div>

        <Menu theme="dark" mode="inline" onSelect={({ key }) => setPage(key)} defaultSelectedKeys={[page]}>
          {/* mode="inline" :菜单类型，现在支持垂直、水平、和内嵌模式三种,现在是内嵌模式。onSelect：被选中时调用，key是item的唯一标志。defaultSelectedKeys:初始选中的菜单项 key 数组 */}
          {menu.map(({ name, icon }, index) => (
            <Menu.Item key={String(index)} icon={icon}>
              {name}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="header">
          <Row justify="space-between">
            {/* 栅格化系统基于 Flex 布局，允许子元素在父节点内的水平对齐方式 */}
            <Col span={8}>
              {/* 通过 row 在水平方向建立一组 column（简写 col）。 你的内容应当放置于 col 内，并且，只有 col 可以作为
                row 的直接元素。 栅格系统中的列是指 1 到 24 的值来表示其跨越的范围。例如，三个等宽的列可以使用来创建。 */}
              <Col span={8} />
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick() {
                  setCollapsed(!collapsed) //  鼠标点击触发器菜单栏展开（不是收起状态）
                },
              })}
            </Col>
            <Col span={8} offset={8} style={{ textAlign: 'right', margin: '0 20px', fontSize: '14px' }}>
              {/* offset栅格左侧的间隔格数，间隔内不可以有栅格 使用 offset 可以将列向右侧偏。例如，offset={8} 将元素向右侧偏移了8个列（column）的宽度。*/}
              <Space>
                {/* 设置组件之间的间距。避免组件黏在一起，拉开一定距离，适合行内元素的水平间距 */}
                <a>
                  <UserOutlined />
                  admin
                </a>
                <a href="login.html">
                  <PoweroffOutlined />
                  退出登录
                </a>
              </Space>
            </Col>
          </Row>
        </Header>
        <Content
          style={{
            padding: '24px 16px',
            overflow: 'auto',
            minHeight: 280,
          }}
        >
          {menu[Number(page)].render}
        </Content>
      </Layout>
    </Layout>
  )
}
