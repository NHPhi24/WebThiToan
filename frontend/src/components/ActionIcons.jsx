import React from 'react';
import { Button, Tooltip, Popconfirm } from 'antd';
import {
  Plus,
  Edit,
  Trash,
  Eye,
  ClipboardCheck,
  ClipboardList,
  LucideHistory,
  LucideChartNoAxesCombined,
  FilePlus2,
  Copy,
  CheckCheck,
  CirclePause,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Flexible operation column, renders only buttons for handlers provided
const OperationColumn = ({
  handleAdd,
  handleEdit,
  handleDelete,
  handleView,
  handlePublish,
  handleCheck,
  handleApprove, // mới: phê duyệt
  handleReject, // mới: từ chối
  handleViewHistory,
  handleViewStatistics,
  handleViewData,
  handleInsertData,
  handleDuplicate,
  handleInactivate,
  canEdit = true,
  canInactivate = 0,
  inactivateText,
  showPopconfirm = true,
}) => (
  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
    {handleApprove && (
      <Tooltip title="Phê duyệt">
        <Popconfirm title="Bạn có chắc chắn muốn phê duyệt?" onConfirm={handleApprove} okText="Có" cancelText="Không">
          <Button size="small" shape="circle" type="default" style={{ color: 'green' }}>
            <CheckCircle size={16} />
          </Button>
        </Popconfirm>
      </Tooltip>
    )}
    {handleReject && (
      <Tooltip title="Từ chối">
        <Popconfirm title="Bạn có chắc chắn muốn từ chối?" onConfirm={handleReject} okText="Có" cancelText="Không">
          <Button size="small" shape="circle" type="default" style={{ color: 'red' }}>
            <XCircle size={16} />
          </Button>
        </Popconfirm>
      </Tooltip>
    )}
    {handleAdd && (
      <Tooltip title="Thêm mới">
        <Button size="small" onClick={handleAdd} shape="circle" type="default">
          <Plus size={16} />
        </Button>
      </Tooltip>
    )}
    {handleView && (
      <Tooltip title="Xem chi tiết">
        <Button size="small" onClick={handleView} shape="circle" type="default">
          <Eye size={16} />
        </Button>
      </Tooltip>
    )}
    {canEdit && handleEdit && (
      <Tooltip title="Chỉnh sửa">
        <Button size="small" onClick={handleEdit} shape="circle" type="default">
          <Edit size={16} />
        </Button>
      </Tooltip>
    )}
    {canEdit && handleDelete && (
      <Tooltip title="Xóa bản ghi">
        {showPopconfirm ? (
          <Popconfirm title="Bạn có chắc chắn muốn xóa ?" onConfirm={handleDelete} okText="Có" cancelText="Không">
            <Button size="small" shape="circle" type="default" danger>
              <Trash size={16} />
            </Button>
          </Popconfirm>
        ) : (
          <Button size="small" shape="circle" type="default" danger onClick={handleDelete}>
            <Trash size={16} />
          </Button>
        )}
      </Tooltip>
    )}
    {canEdit && handleDuplicate && (
      <Tooltip title="Nhân bản">
        <Popconfirm title="Bạn có chắc chắn muốn nhân bản ?" onConfirm={handleDuplicate} okText="Có" cancelText="Không">
          <Button size="small" shape="circle" type="default">
            <Copy size={16} />
          </Button>
        </Popconfirm>
      </Tooltip>
    )}
    {handlePublish && (
      <Tooltip title="Công bố">
        <Popconfirm title="Bạn có chắc chắn muốn công bố ?" onConfirm={handlePublish} okText="Có" cancelText="Không">
          <Button size="small" shape="circle" type="default">
            <ClipboardCheck size={16} />
          </Button>
        </Popconfirm>
      </Tooltip>
    )}
    {handleCheck && (
      <Tooltip title="Kiểm tra">
        <Popconfirm title="Bạn có chắc chắn muốn kiểm tra ?" onConfirm={handleCheck} okText="Có" cancelText="Không">
          <Button size="small" shape="circle" type="default">
            <CheckCheck size={16} />
          </Button>
        </Popconfirm>
      </Tooltip>
    )}
    {handleViewStatistics && (
      <Tooltip title="Thống kê dữ liệu chỉ tiêu">
        <Button size="small" onClick={handleViewStatistics} shape="circle" type="default">
          <LucideChartNoAxesCombined size={16} />
        </Button>
      </Tooltip>
    )}
    {handleInsertData && (
      <Tooltip title="Nhập dữ liệu">
        <Button size="small" onClick={handleInsertData} shape="circle" type="default">
          <FilePlus2 size={16} />
        </Button>
      </Tooltip>
    )}
    {canInactivate === 1 && handleInactivate && (
      <Tooltip title={inactivateText ? inactivateText : 'Dừng hoạt động'}>
        <Popconfirm
          title={`Bạn có chắc chắn muốn ${inactivateText ? inactivateText.toLocaleLowerCase() : 'dừng hoạt động '} ?`}
          onConfirm={handleInactivate}
          okText="Có"
          cancelText="Không"
        >
          <Button size="small" shape="circle" style={{ borderColor: 'orange' }} type="default">
            <CirclePause size={16} color="orange" />
          </Button>
        </Popconfirm>
      </Tooltip>
    )}
  </div>
);

export default OperationColumn;
