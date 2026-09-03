import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseClient";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")          // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start
    .replace(/-+$/, "");            // Trim - from end
}

async function uploadFile(supabase, bucket, file, prefix) {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${prefix}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const path = `uploads/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

function parseFields(formData) {
  return {
    title: formData.get("title"),
    author: formData.get("author"),
    category: formData.get("category"),
    summary: formData.get("summary"),
    publishDate: formData.get("publish_date"),
    metaLine: formData.get("meta_line"),
    fileInfo: formData.get("file_info"),
    tagsRaw: formData.get("tags"),
    sectionsRaw: formData.get("sections"),
    coverImageFile: formData.get("image"),
    pdfFile: formData.get("file"),
  };
}

async function resolveSections(supabase, formData, sections) {
  const processedSections = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    let sectionImageUrl = section.image;

    if (section.image && typeof section.image === "string" && section.image.startsWith("section_image_")) {
      const fileKey = section.image;
      const sectionImageFile = formData.get(fileKey);

      if (sectionImageFile) {
        sectionImageUrl = await uploadFile(supabase, "blog-images", sectionImageFile, `sec-${i}`);
      }
    }

    processedSections.push({
      heading: section.heading?.trim() || "",
      content: section.content?.trim() || "",
      image: sectionImageUrl,
      caption: section.caption?.trim() || null
    });
  }
  return processedSections;
}

// GET all whitepapers ordered by created_at DESC
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: whitepapers, error } = await supabase
      .from("white_papers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, whitepapers });
  } catch (err) {
    console.error("GET Whitepapers API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve whitepapers collection." },
      { status: 500 }
    );
  }
}

// POST: Create a new whitepaper
export async function POST(request) {
  try {
    const formData = await request.formData();
    const {
      title, author, category, summary, publishDate, metaLine, fileInfo,
      tagsRaw, sectionsRaw, coverImageFile, pdfFile
    } = parseFields(formData);

    if (!title?.trim() || !author?.trim() || !category?.trim() || !summary?.trim() || !publishDate || !coverImageFile || !pdfFile || !sectionsRaw) {
      return NextResponse.json(
        { error: "Title, author, category, summary, publish date, cover image, PDF file, and sections are required." },
        { status: 400 }
      );
    }

    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const sections = JSON.parse(sectionsRaw);
    const supabase = createAdminClient();

    // 1. Generate unique slug from title
    let slug = slugify(title);
    const { data: existingWhitepapers } = await supabase
      .from("white_papers")
      .select("id")
      .eq("slug", slug);

    if (existingWhitepapers && existingWhitepapers.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 2. Upload cover image and PDF file
    let coverUrl;
    let downloadUrl;
    try {
      coverUrl = await uploadFile(supabase, "blog-images", coverImageFile, "cover");
      downloadUrl = await uploadFile(supabase, "whitepaper-files", pdfFile, "doc");
    } catch (uploadError) {
      console.error("Whitepaper file upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 3. Resolve section images
    const processedSections = await resolveSections(supabase, formData, sections);

    // 4. Insert whitepaper row
    const { data: whitepaperData, error: insertError } = await supabase
      .from("white_papers")
      .insert({
        title: title.trim(),
        slug,
        author: author.trim(),
        category: category.trim(),
        summary: summary.trim(),
        meta_line: metaLine?.trim() || null,
        publish_date: publishDate,
        cover_image: coverUrl,
        tags,
        file_info: fileInfo?.trim() || null,
        download_url: downloadUrl,
        sections: processedSections,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Whitepaper insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to save whitepaper details: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, whitepaper: whitepaperData }, { status: 201 });

  } catch (err) {
    console.error("Whitepaper POST API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during whitepaper posting." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing whitepaper
export async function PUT(request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id");
    const {
      title, author, category, summary, publishDate, metaLine, fileInfo,
      tagsRaw, sectionsRaw, coverImageFile: coverImage, pdfFile
    } = parseFields(formData);

    if (!id || !title?.trim() || !author?.trim() || !category?.trim() || !summary?.trim() || !publishDate || !sectionsRaw) {
      return NextResponse.json(
        { error: "Whitepaper ID, title, author, category, summary, publish date, and sections are required." },
        { status: 400 }
      );
    }

    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const sections = JSON.parse(sectionsRaw);
    const supabase = createAdminClient();

    // 1. Resolve cover image URL
    let coverUrl = "";
    try {
      if (coverImage && typeof coverImage !== "string") {
        coverUrl = await uploadFile(supabase, "blog-images", coverImage, "cover");
      } else {
        coverUrl = coverImage || "";
      }
    } catch (coverUploadError) {
      console.error("Cover image upload error:", coverUploadError);
      return NextResponse.json(
        { error: `Failed to upload new cover image: ${coverUploadError.message}` },
        { status: 500 }
      );
    }

    // 2. Resolve PDF download URL
    let downloadUrl = "";
    try {
      if (pdfFile && typeof pdfFile !== "string") {
        downloadUrl = await uploadFile(supabase, "whitepaper-files", pdfFile, "doc");
      } else {
        downloadUrl = pdfFile || "";
      }
    } catch (fileUploadError) {
      console.error("PDF file upload error:", fileUploadError);
      return NextResponse.json(
        { error: `Failed to upload new PDF file: ${fileUploadError.message}` },
        { status: 500 }
      );
    }

    // 3. Resolve section images
    const processedSections = await resolveSections(supabase, formData, sections);

    // 4. Generate unique slug if title has changed or matches
    let slug = slugify(title);
    const { data: duplicateWhitepapers } = await supabase
      .from("white_papers")
      .select("id")
      .eq("slug", slug)
      .neq("id", id);

    if (duplicateWhitepapers && duplicateWhitepapers.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 5. Update entry
    const { data: updatedWhitepaper, error: updateError } = await supabase
      .from("white_papers")
      .update({
        title: title.trim(),
        slug,
        author: author.trim(),
        category: category.trim(),
        summary: summary.trim(),
        meta_line: metaLine?.trim() || null,
        publish_date: publishDate,
        cover_image: coverUrl,
        tags,
        file_info: fileInfo?.trim() || null,
        download_url: downloadUrl,
        sections: processedSections,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Whitepaper update error:", updateError);
      return NextResponse.json(
        { error: `Failed to update whitepaper details: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, whitepaper: updatedWhitepaper });

  } catch (err) {
    console.error("Whitepaper PUT API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during whitepaper updates." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a whitepaper by query ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Whitepaper ID is required for deletion." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error: deleteError } = await supabase
      .from("white_papers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Whitepaper delete error:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete whitepaper: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Whitepaper successfully deleted." });
  } catch (err) {
    console.error("Whitepaper DELETE API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during whitepaper deletion." },
      { status: 500 }
    );
  }
}
