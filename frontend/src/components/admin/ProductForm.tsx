import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  Save,
  Plus,
  X,
  AlertCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Tag,
  DollarSign,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";
import { useProductStore } from "../../store/productStore";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";

interface ProductFormProps {
  mode: "create" | "edit";
}

const ProductForm: React.FC<ProductFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const {
    currentProduct,
    categories,
    isSubmitting,
    createProduct,
    updateProduct,
    fetchProduct,
    fetchCategories,
    clearCurrentProduct,
  } = useProductStore();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    originalPrice: 0,
    currency: "USD",
    imageUrl: "",
    images: [] as string[],
    category: "",
    subcategory: "",
    tags: [] as string[],
    specifications: {
      brand: "",
      model: "",
      color: [] as string[],
      size: [] as string[],
      material: "",
      weight: "",
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: "cm",
      },
    },
    supplier: {
      name: "",
      platform: "other" as "alibaba" | "1688" | "taobao" | "other",
      url: "",
      rating: 0,
      location: "",
    },
    stock: {
      available: true,
      quantity: 0,
      minOrderQuantity: 1,
    },
    shipping: {
      estimatedDays: {
        min: 0,
        max: 0,
      },
      cost: 0,
      freeShippingThreshold: 0,
    },
    featured: false,
    isActive: true, // Products are visible to all users by default
  });

  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newImage, setNewImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    fetchCategories();

    if (mode === "edit" && productId) {
      fetchProduct(productId);
    }

    return () => {
      clearCurrentProduct();
    };
  }, [mode, productId]);

  useEffect(() => {
    if (mode === "edit" && currentProduct) {
      setFormData({
        name: currentProduct.name,
        description: currentProduct.description,
        price: currentProduct.price,
        originalPrice: currentProduct.originalPrice || 0,
        currency: currentProduct.currency || "USD",
        imageUrl: currentProduct.imageUrl,
        images: currentProduct.images || [],
        category: currentProduct.category,
        subcategory: currentProduct.subcategory || "",
        tags: currentProduct.tags || [],
        specifications: {
          brand: currentProduct.specifications?.brand || "",
          model: currentProduct.specifications?.model || "",
          color: currentProduct.specifications?.color || [],
          size: currentProduct.specifications?.size || [],
          material: currentProduct.specifications?.material || "",
          weight: currentProduct.specifications?.weight || "",
          dimensions: {
            length: currentProduct.specifications?.dimensions?.length || 0,
            width: currentProduct.specifications?.dimensions?.width || 0,
            height: currentProduct.specifications?.dimensions?.height || 0,
            unit: currentProduct.specifications?.dimensions?.unit || "cm",
          },
        },
        supplier: {
          name: currentProduct.supplier?.name || "",
          platform: currentProduct.supplier?.platform || "other",
          url: currentProduct.supplier?.url || "",
          rating: currentProduct.supplier?.rating || 0,
          location: currentProduct.supplier?.location || "",
        },
        stock: {
          available: currentProduct.stock?.available ?? true,
          quantity: currentProduct.stock?.quantity || 0,
          minOrderQuantity: currentProduct.stock?.minOrderQuantity || 1,
        },
        shipping: {
          estimatedDays: {
            min: currentProduct.shipping?.estimatedDays?.min || 0,
            max: currentProduct.shipping?.estimatedDays?.max || 0,
          },
          cost: currentProduct.shipping?.cost || 0,
          freeShippingThreshold:
            currentProduct.shipping?.freeShippingThreshold || 0,
        },
        featured: currentProduct.featured,
        isActive: currentProduct.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentProduct]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name.includes(".")) {
      const [parent, child, grandchild] = name.split(".");
      setFormData((prev) => {
        const parentObj = prev[parent as keyof typeof prev] as any;

        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: grandchild
              ? {
                  ...parentObj[child],
                  [grandchild]:
                    type === "number" ? parseFloat(value) || 0 : value,
                }
              : type === "number"
              ? parseFloat(value) || 0
              : value,
          },
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "number"
            ? parseFloat(value) || 0
            : type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddColor = () => {
    if (
      newColor.trim() &&
      !formData.specifications.color.includes(newColor.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          color: [...prev.specifications.color, newColor.trim()],
        },
      }));
      setNewColor("");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRemoveColor = (colorToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        color: prev.specifications.color.filter(
          (color) => color !== colorToRemove
        ),
      },
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddSize = () => {
    if (
      newSize.trim() &&
      !formData.specifications.size.includes(newSize.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          size: [...prev.specifications.size, newSize.trim()],
        },
      }));
      setNewSize("");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRemoveSize = (sizeToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        size: prev.specifications.size.filter((size) => size !== sizeToRemove),
      },
    }));
  };

  const handleAddImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImage.trim()],
      }));
      setNewImage("");
    }
  };

  const handleRemoveImage = (imageToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image !== imageToRemove),
      // If removing the main image, set first remaining image as main
      imageUrl: prev.imageUrl === imageToRemove 
        ? (prev.images.find(img => img !== imageToRemove) || '')
        : prev.imageUrl
    }));
  };

  // Convert base64 data URI to File object
  const dataURItoFile = (dataURI: string, filename: string): File => {
    const arr = dataURI.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 10MB`);
          continue;
        }

        formDataUpload.append('files', file);
      }

      if (formDataUpload.getAll('files').length === 0) {
        setUploadingImage(false);
        return;
      }

      // Get auth token
      const authToken = accessToken 
        ? `Bearer ${accessToken}` 
        : axios.defaults.headers.common['Authorization'] as string;

      if (!authToken) {
        toast.error('Authentication required. Please log in again.');
        setUploadingImage(false);
        return;
      }

      const response = await axios.post('/upload/multiple', formDataUpload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': authToken
        }
      });

      // Extract URLs from response
      const uploadedImages = response.data.files.map((f: any) => f.fileUrl || f.url || f.imageUrl);
      
      if (uploadedImages.length === 0) {
        toast.error('No images were uploaded');
        setUploadingImage(false);
        return;
      }

      // PRIORITY: Always set first uploaded image as imageUrl (overwrite existing if any)
      const firstImage = uploadedImages[0];
      
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: firstImage, // Always use uploaded image as priority
        images: uploadedImages.length > 1 
          ? [firstImage, ...uploadedImages.slice(1), ...prev.images.filter(img => img !== firstImage)]
          : [firstImage, ...prev.images.filter(img => img !== firstImage)]
      }));
      
      toast.success(`${uploadedImages.length} image(s) uploaded successfully. Main image set automatically.`);
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImage(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Handle paste event for base64 images
  const handleImagePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          // Convert blob to file and upload directly
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
          await uploadFile(file);
        }
        break;
      }
    }
  };

  // Upload a single file
  const uploadFile = async (file: File) => {
    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('files', file);

      // Get auth token
      const authToken = accessToken 
        ? `Bearer ${accessToken}` 
        : axios.defaults.headers.common['Authorization'] as string;

      if (!authToken) {
        toast.error('Authentication required. Please log in again.');
        setUploadingImage(false);
        return;
      }

      const response = await axios.post('/upload/multiple', formDataUpload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': authToken
        }
      });

      // Extract URLs from response
      const uploadedImages = response.data.files.map((f: any) => f.fileUrl || f.url || f.imageUrl);
      
      if (uploadedImages.length === 0) {
        toast.error('Image upload failed');
        setUploadingImage(false);
        return;
      }

      // PRIORITY: Always set uploaded image as imageUrl (overwrite existing if any)
      const uploadedImage = uploadedImages[0];
      
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: uploadedImage, // Always use uploaded image as priority
        images: [uploadedImage, ...prev.images.filter(img => img !== uploadedImage)]
      }));
      
      toast.success('Image uploaded successfully and set as main image.');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle URL input - check if it's base64 and convert
  const handleImageUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    
    // Check if it's a base64 data URI
    if (value.startsWith('data:image/')) {
      try {
        // Convert base64 to file and upload
        const file = dataURItoFile(value, `base64-image-${Date.now()}.jpg`);
        await uploadFile(file);
        // Clear the input since we're uploading the file
        e.target.value = '';
        return;
      } catch (error) {
        console.error('Failed to convert base64 to file:', error);
        toast.error('Failed to process base64 image. Please use file upload instead.');
        return;
      }
    }
    
    // Regular URL input
    handleInputChange(e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validate required fields
    if (!formData.name.trim()) {
      setSubmitError('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      setSubmitError('Product description is required');
      return;
    }
    if (formData.price <= 0) {
      setSubmitError('Product price must be greater than 0');
      return;
    }
    // Check if we have at least one image (either uploaded or URL)
    // File upload is priority - if images array has items, use first one
    if (formData.images.length > 0) {
      // Use first uploaded image as imageUrl
      if (!formData.imageUrl || formData.imageUrl !== formData.images[0]) {
        setFormData(prev => ({
          ...prev,
          imageUrl: prev.images[0]
        }));
      }
    } else if (!formData.imageUrl.trim()) {
      // No uploaded images and no URL - require at least one
      setSubmitError('Please upload at least one product image using the file upload button above.');
      return;
    }
    if (!formData.category.trim()) {
      setSubmitError('Product category is required');
      return;
    }

    try {
      console.log('🚀 Submitting product form...');
      console.log('📦 Mode:', mode);
      console.log('📋 Form data:', formData);

        if (mode === "create") {
          console.log('➕ Creating new product...');
          console.log('📋 Form data being sent:', JSON.stringify(formData, null, 2));
          
          // Note: Product will be visible to all users by default (status: published, isActive: true)
          try {
            const newProduct = await createProduct(formData);
            
            // Additional success logging in form component
            console.log('🎉 Form: Product creation completed!');
            console.log('📋 Product details:', {
              id: newProduct._id,
              name: newProduct.name,
              price: newProduct.price,
              category: newProduct.category,
              status: newProduct.status || (newProduct.isActive ? 'published' : 'draft')
            });
            
            setSubmitSuccess(true);
            
            // Show alert message with product details
            alert(
              `✅ Product Created Successfully!\n\n` +
              `📦 Product Name: ${newProduct.name}\n` +
              `💰 Price: ${newProduct.price} ${newProduct.currency || 'USD'}\n` +
              `📂 Category: ${newProduct.category}\n` +
              `✅ Status: ${newProduct.status || (newProduct.isActive ? 'Published' : 'Draft')}\n` +
              `⭐ Featured: ${newProduct.featured ? 'Yes' : 'No'}\n` +
              `👁️  Visible to Users: ${newProduct.isActive ? 'Yes' : 'No'}\n\n` +
              `🔄 You will be redirected to the products list in a moment...`
            );
            
            // Also show toast notification
            toast.success(
              `✅ Product "${newProduct.name}" created successfully!\n🔄 Redirecting to products list...`,
              {
                autoClose: 2000,
                position: 'top-right'
              }
            );
            
            // Navigate after a short delay to show success message
            setTimeout(() => {
              console.log('🔄 Navigating to products list page...');
              console.log('📍 Route: /admin/products');
              navigate("/admin/products", { replace: true });
            }, 1500);
          } catch (createError: any) {
            console.error('❌ Error in createProduct call:', createError);
            // Error is already handled in createProduct, just re-throw
            throw createError;
          }
      } else if (mode === "edit" && productId) {
        console.log('✏️ Updating product...');
        await updateProduct(productId, formData);
        console.log('✅ Product updated');
        
        setSubmitSuccess(true);
        toast.success('Product updated successfully!', {
          autoClose: 2000,
          onClose: () => {
            navigate("/admin/products");
          }
        });
        
        setTimeout(() => {
          navigate("/admin/products");
        }, 1500);
      }
    } catch (error: any) {
      console.error('❌ Form submission error:', error);
      
      // Get error message from store or error object
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          'Failed to save product. Please try again.';
      
      setSubmitError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        autoClose: 5000
      });
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </button>

          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {mode === "create" ? "Add New Product" : "Edit Product"}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {mode === "create"
                  ? "Add a new product to your catalog"
                  : "Update product information and settings"}
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <div className="w-5 h-5 text-green-600 mr-3">✓</div>
              <div>
                <h3 className="text-sm font-semibold text-green-800">Success!</h3>
                <p className="text-sm text-green-700 mt-1">
                  {mode === "create" ? "Product created successfully!" : "Product updated successfully!"}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <Package className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Detailed product description..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select category</option>
                        {categories && Array.isArray(categories) && categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Home & Garden">Home & Garden</option>
                        <option value="Sports">Sports</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Automotive">Automotive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleInputChange}
                        placeholder="Enter subcategory"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Pricing
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="USD">USD</option>
                      <option value="RWF">RWF</option>
                      <option value="Yuan">Yuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <ImageIcon className="w-6 h-6 text-purple-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Images
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Image (Upload Local File) *
                    </label>
                    <div className="space-y-2">
                      {/* File Upload Button - PRIMARY METHOD */}
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploadingImage}
                            multiple
                          />
                          <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-500 rounded-xl hover:border-blue-600 transition-colors bg-blue-50 hover:bg-blue-100">
                            <Upload className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-blue-700">
                              {uploadingImage ? 'Uploading...' : '📁 Click to upload image from your computer'}
                            </span>
                          </div>
                        </label>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Upload an image file. The first image will automatically be set as the main product image.
                      </p>
                      
                      {/* Preview */}
                      {formData.imageUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">Preview:</p>
                          <img
                            src={(() => {
                              if (formData.imageUrl.startsWith('http://') || formData.imageUrl.startsWith('https://')) {
                                return formData.imageUrl;
                              }
                              if (formData.imageUrl.startsWith('/')) {
                                const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                  ? 'http://localhost:5001'
                                  : `${window.location.protocol}//${window.location.hostname}:5001`;
                                return `${baseUrl}${formData.imageUrl}`;
                              }
                              const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                ? 'http://localhost:5001'
                                : `${window.location.protocol}//${window.location.hostname}:5001`;
                              return `${baseUrl}/${formData.imageUrl}`;
                            })()}
                            alt="Preview"
                            className="max-w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Images
                    </label>
                    <div className="space-y-2">
                      {/* File Upload for Multiple Images */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploadingImage}
                          multiple
                        />
                        <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-gray-50 hover:bg-gray-100">
                          <Upload className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            {uploadingImage ? 'Uploading...' : 'Upload more images'}
                          </span>
                        </div>
                      </label>
                      
                      {/* Image Thumbnails */}
                      <div className="flex flex-wrap gap-2">
                        {formData.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative group"
                          >
                            <img
                              src={(() => {
                                if (image.startsWith('http://') || image.startsWith('https://')) {
                                  return image;
                                }
                                if (image.startsWith('/')) {
                                  const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                    ? 'http://localhost:5001'
                                    : `${window.location.protocol}//${window.location.hostname}:5001`;
                                  return `${baseUrl}${image}`;
                                }
                                const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                  ? 'http://localhost:5001'
                                  : `${window.location.protocol}//${window.location.hostname}:5001`;
                                return `${baseUrl}/${image}`;
                              })()}
                              alt={`Product ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(image)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <Tag className="w-6 h-6 text-indigo-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Tags</h2>
                </div>

                <div>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full"
                      >
                        <span className="text-sm">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status & Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Status & Settings
                </h3>

                <div className="space-y-4">
                  {mode === 'create' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Product Visibility
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              ✅ <strong>New products are visible to all users by default.</strong>
                            </p>
                            <p className="mt-1">
                              After creation, you can change the visibility status from the product management page.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {mode === 'edit' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Product Status</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.isActive ? '✅ Published (Visible to all users)' : '📝 Draft (Hidden from users)'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 To change visibility, use the status toggle button on the product management page.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Featured
                    </label>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Available
                    </label>
                    <input
                      type="checkbox"
                      name="stock.available"
                      checked={formData.stock.available}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Stock Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="stock.quantity"
                      value={formData.stock.quantity}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Order Quantity
                    </label>
                    <input
                      type="number"
                      name="stock.minOrderQuantity"
                      value={formData.stock.minOrderQuantity}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.name.trim() ||
                      formData.price <= 0
                    }
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {mode === "create" ? "Creating..." : "Updating..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        {mode === "create"
                          ? "Create Product"
                          : "Update Product"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/products")}
                    className="w-full px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
