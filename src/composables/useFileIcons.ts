import { Paperclip, FileText, FileSpreadsheet, Presentation } from "lucide-vue-next"

export const useFileIcons = () => {
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'doc':
      case 'docx':
      case 'hwp':
      case 'hwxp':
      case 'txt':
      case 'pdf':
        return FileText
      case 'ppt':
      case 'pptx':
        return Presentation
      case 'xlsx':
      case 'xls':
        return FileSpreadsheet
      default:
        return Paperclip
    }
  }

  const getFileColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'doc':
      case 'docx':
        return 'text-blue-600'
      case 'hwp':
      case 'hwxp':
        return 'text-blue-300'
      case 'pdf':
        return 'text-red-500'
      case 'ppt':
      case 'pptx':
        return 'text-orange-500'
      case 'xlsx':
      case 'xls':
        return 'text-green-700'
      case 'txt':
        return 'text-slate-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return {
    getFileIcon,
    getFileColor,
    formatFileSize
  }
}